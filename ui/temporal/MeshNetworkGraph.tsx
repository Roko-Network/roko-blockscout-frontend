/**
 * MeshNetworkGraph
 *
 * Pure SVG network visualization of the temporal validator mesh.
 * Displays validators as nodes arranged in a circle, with edges between
 * connected pairs showing pairwise latencies and sample confidence.
 *
 * Props:
 *   data      – TemporalMeshState returned by fetchTemporalMeshState()
 *   isLoading – whether the parent query is still loading
 *
 * No external charting library is used — the component renders only SVG
 * primitives inside a Chakra UI Box container.
 */

import { Box } from '@chakra-ui/react';
import React, { useMemo } from 'react';

import type {
  TemporalMeshState,
  TemporalValidatorReport,
  TemporalPairwiseOffset,
} from 'types/api/temporalMesh';

import { formatOffsetNs } from 'lib/api/services/general/temporalMeshRpc';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface Props {
  data: TemporalMeshState | undefined;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------

const VIEW_WIDTH = 600;
const VIEW_HEIGHT = 300;
const CENTER_X = VIEW_WIDTH / 2;
const CENTER_Y = VIEW_HEIGHT / 2;

/** Radius of the circle on which validator nodes are placed. */
const ORBIT_RADIUS = 110;

/** Min / max visual radius for validator circles (reputation-driven). */
const NODE_RADIUS_MIN = 12;
const NODE_RADIUS_MAX = 22;

/** Reputation basis-point threshold (0–10000) for colour transitions. */
const REP_GREEN_THRESHOLD = 8000; // >80%
const REP_YELLOW_THRESHOLD = 5000; // >50%

// Status colours remain explicit; surface and text colours use semantic CSS
// variables so the graph follows the application colour mode.
const COLOR_GREEN = '#48BB78';
const COLOR_YELLOW = '#ECC94B';
const COLOR_RED = '#FC8181';

// Edge colour thresholds (nanoseconds).
const EDGE_GREEN_MAX_NS = 50_000; // <50 µs
const EDGE_YELLOW_MAX_NS = 1_000_000; // <1 ms

const BG_COLOR = 'var(--chakra-colors-bg-elevated)';
const TEXT_COLOR = 'var(--chakra-colors-text-primary)';
const TEXT_MUTED = 'var(--chakra-colors-text-secondary)';

// ---------------------------------------------------------------------------
// Pure geometry / colour helpers (non-React — fast, stable)
// ---------------------------------------------------------------------------

function nodeColor(reputation: number): string {
  if (reputation >= REP_GREEN_THRESHOLD) return COLOR_GREEN;
  if (reputation >= REP_YELLOW_THRESHOLD) return COLOR_YELLOW;
  return COLOR_RED;
}

function nodeRadius(reputation: number, maxReputation: number): number {
  // Scale from NODE_RADIUS_MIN → NODE_RADIUS_MAX proportionally to reputation.
  const norm = maxReputation > 0 ? reputation / maxReputation : 1;
  return NODE_RADIUS_MIN + norm * (NODE_RADIUS_MAX - NODE_RADIUS_MIN);
}

function edgeColor(absOffsetNs: number): string {
  if (absOffsetNs < EDGE_GREEN_MAX_NS) return COLOR_GREEN;
  if (absOffsetNs < EDGE_YELLOW_MAX_NS) return COLOR_YELLOW;
  return COLOR_RED;
}

function edgeWidth(samples: number, maxSamples: number): number {
  // Clamp between 1px and 3.5px based on relative sample count.
  const norm = maxSamples > 0 ? samples / maxSamples : 1;
  return 1 + norm * 2.5;
}

/** Compute (x, y) for a node placed at position `idx` out of `total` on the orbit. */
function nodePosition(
  idx: number,
  total: number,
): { x: number; y: number } {
  if (total === 0) return { x: CENTER_X, y: CENTER_Y };
  if (total === 1) return { x: CENTER_X, y: CENTER_Y - ORBIT_RADIUS };

  // Rotate so that the first node starts at the top (−π/2).
  const angle = -Math.PI / 2 + (2 * Math.PI * idx) / total;
  return {
    x: CENTER_X + ORBIT_RADIUS * Math.cos(angle),
    y: CENTER_Y + ORBIT_RADIUS * Math.sin(angle),
  };
}

// ---------------------------------------------------------------------------
// Sub-components (plain functions, not React components, to avoid re-mounts)
// ---------------------------------------------------------------------------

interface NodeProps {
  cx: number;
  cy: number;
  radius: number;
  fill: string;
  strokeWidth: number;
  label: string;
  isProducer: boolean;
}

function ValidatorNode({ cx, cy, radius, fill, strokeWidth, label, isProducer }: NodeProps) {
  return (
    <g>
      { /* Pulse ring for the producer node */ }
      { isProducer && (
        <circle
          cx={ cx }
          cy={ cy }
          r={ radius + 8 }
          fill="none"
          stroke={ fill }
          strokeWidth={ 1.5 }
          opacity={ 0.4 }
        >
          <animate
            attributeName="r"
            values={ `${ radius + 4 };${ radius + 14 };${ radius + 4 }` }
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.5;0.1;0.5"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>
      ) }

      { /* Main node circle */ }
      <circle
        cx={ cx }
        cy={ cy }
        r={ radius }
        fill={ fill }
        fillOpacity={ 0.85 }
        stroke={ isProducer ? 'var(--chakra-colors-border-strong)' : fill }
        strokeWidth={ strokeWidth }
        data-testid={ isProducer ? 'producer-node' : 'validator-node' }
      />

      { /* Node label */ }
      <text
        x={ cx }
        y={ cy + radius + 14 }
        textAnchor="middle"
        fontSize="11"
        fontFamily="monospace"
        fill={ TEXT_COLOR }
        fontWeight={ isProducer ? 700 : 400 }
      >
        { label }
      </text>
    </g>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface ComputedNode {
  authorityIndex: number;
  x: number;
  y: number;
  radius: number;
  fill: string;
  isProducer: boolean;
  report: TemporalValidatorReport | undefined;
}

interface ComputedEdge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width: number;
  label: string;
  midX: number;
  midY: number;
}

function computeGraph(data: TemporalMeshState): {
  nodes: Array<ComputedNode>;
  edges: Array<ComputedEdge>;
  producerIndex: number;
} {
  // Determine the set of unique authority indices to display.
  // The producer (authority 0, or whatever from_index appears in pairwise_offsets)
  // may not be in the validators array, so we collect all indices seen.
  const validatorMap = new Map<number, TemporalValidatorReport>();
  for (const v of data.validators) {
    validatorMap.set(v.authority_index, v);
  }

  // The producer is the from_index that appears most often in pairwise_offsets,
  // defaulting to 0.
  const producerIndex = data.pairwise_offsets.length > 0 ?
    data.pairwise_offsets[0]!.from_index :
    0;

  // Build the full set of authority indices to display.
  const indicesSet = new Set<number>();
  for (const v of data.validators) indicesSet.add(v.authority_index);
  for (const p of data.pairwise_offsets) {
    indicesSet.add(p.from_index);
    indicesSet.add(p.to_index);
  }

  const sortedIndices = Array.from(indicesSet).sort((a, b) => a - b);
  const total = sortedIndices.length;

  // Maximum reputation for scaling.
  const maxReputation = Math.max(
    ...data.validators.map((v) => v.reputation),
    10000,
  );

  // Build node objects.
  const positionByIndex = new Map<number, { x: number; y: number }>();
  const nodes: Array<ComputedNode> = sortedIndices.map((idx, i) => {
    const pos = nodePosition(i, total);
    positionByIndex.set(idx, pos);
    const report = validatorMap.get(idx);
    const reputation = report?.reputation ?? 9000; // producer defaults to high reputation
    return {
      authorityIndex: idx,
      x: pos.x,
      y: pos.y,
      radius: nodeRadius(reputation, maxReputation),
      fill: nodeColor(reputation),
      isProducer: idx === producerIndex,
      report,
    };
  });

  // Maximum samples across all pairwise offsets for edge width scaling.
  // We approximate samples per edge from the validator's total samples divided
  // by peer count, because the pairwise offset entries do not carry sample counts.
  // Fall back to a flat weight of 1 when no validator data is available.
  const validatorSamplesMap = new Map<number, number>();
  for (const v of data.validators) {
    validatorSamplesMap.set(v.authority_index, v.samples);
  }
  const maxSamples = Math.max(
    ...Array.from(validatorSamplesMap.values()),
    1,
  );

  // Build edge objects.
  const edges: Array<ComputedEdge> = data.pairwise_offsets.map((p: TemporalPairwiseOffset) => {
    const from = positionByIndex.get(p.from_index) ?? { x: CENTER_X, y: CENTER_Y };
    const to = positionByIndex.get(p.to_index) ?? { x: CENTER_X, y: CENTER_Y };
    const absOffset = Math.abs(p.offset_ns);
    const samples = validatorSamplesMap.get(p.to_index) ?? 1;

    return {
      x1: from.x,
      y1: from.y,
      x2: to.x,
      y2: to.y,
      color: edgeColor(absOffset),
      width: edgeWidth(samples, maxSamples),
      label: formatOffsetNs(p.offset_ns),
      midX: (from.x + to.x) / 2,
      midY: (from.y + to.y) / 2,
    };
  });

  return { nodes, edges, producerIndex };
}

// ---------------------------------------------------------------------------
// Quality percentage text colour
// ---------------------------------------------------------------------------

function qualityTextColor(pct: number): string {
  if (pct >= 90) return COLOR_GREEN;
  if (pct >= 70) return COLOR_YELLOW;
  return COLOR_RED;
}

function convergenceHexColor(state: string): string {
  if (state === 'Converged') return COLOR_GREEN;
  if (state === 'Converging') return COLOR_YELLOW;
  return COLOR_RED;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MeshNetworkGraph: React.FC<Props> = ({ data, isLoading }) => {
  // Memoize the computed graph so positions are stable across renders.
  const graph = useMemo(
    () => (data && (data.validators.length > 0 || data.pairwise_offsets.length > 0) ?
      computeGraph(data!) :
      null),
    [ data ],
  );

  const qualityPct = data?.quality_percent ?? 0;
  const convergenceState = data?.convergence_state ?? 'Diverged';

  return (
    <Box
      bg={ BG_COLOR }
      borderWidth="2px"
      borderColor="border.divider"
      borderRadius="base"
      p={{ base: 4, lg: 6 }}
      mb={ 6 }
    >
      { /* Loading placeholder */ }
      { isLoading && !graph && (
        <Box
          h="300px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <text
            style={{ fontSize: '13px', color: TEXT_MUTED, fontFamily: 'monospace' }}
          >
            Loading mesh…
          </text>
        </Box>
      ) }

      { /* Empty state */ }
      { !isLoading && !graph && (
        <Box
          h="300px"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <svg
            width="100%"
            height={ VIEW_HEIGHT }
            viewBox={ `0 0 ${ VIEW_WIDTH } ${ VIEW_HEIGHT }` }
          >
            <text
              x={ CENTER_X }
              y={ CENTER_Y }
              textAnchor="middle"
              fontSize="13"
              fontFamily="monospace"
              fill={ TEXT_MUTED }
            >
              No validator mesh data available
            </text>
          </svg>
        </Box>
      ) }

      { /* Network graph */ }
      { graph && (
        <svg
          width="100%"
          height={ VIEW_HEIGHT }
          viewBox={ `0 0 ${ VIEW_WIDTH } ${ VIEW_HEIGHT }` }
          aria-label="Validator mesh network graph"
        >
          <defs>
            { /* Subtle radial gradient for background depth */ }
            <radialGradient id="bgGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--chakra-colors-bg-muted)" stopOpacity="0.9"/>
              <stop offset="100%" stopColor={ BG_COLOR } stopOpacity="0"/>
            </radialGradient>
          </defs>

          { /* Background circle halo */ }
          <circle
            cx={ CENTER_X }
            cy={ CENTER_Y }
            r={ ORBIT_RADIUS + 30 }
            fill="url(#bgGradient)"
          />

          { /* Orbit guide ring (subtle) */ }
          <circle
            cx={ CENTER_X }
            cy={ CENTER_Y }
            r={ ORBIT_RADIUS }
            fill="none"
            stroke="var(--chakra-colors-border-divider)"
            strokeWidth="1"
            strokeDasharray="4 6"
          />

          { /* Edges — drawn first so nodes appear on top */ }
          { graph.edges.map((e, i) => (
            <g key={ i }>
              <line
                x1={ e.x1 }
                y1={ e.y1 }
                x2={ e.x2 }
                y2={ e.y2 }
                stroke={ e.color }
                strokeWidth={ e.width }
                strokeOpacity={ 0.6 }
              />
              { /* Edge label at midpoint */ }
              <text
                x={ e.midX }
                y={ e.midY - 4 }
                textAnchor="middle"
                fontSize="9"
                fontFamily="monospace"
                fill={ e.color }
                opacity={ 0.9 }
              >
                { e.label }
              </text>
            </g>
          )) }

          { /* Center info: quality + convergence dot */ }
          <g>
            { /* Convergence dot */ }
            <circle
              cx={ CENTER_X }
              cy={ CENTER_Y - 18 }
              r={ 5 }
              fill={ convergenceHexColor(convergenceState) }
              data-testid="convergence-dot"
            />

            { /* Quality percentage */ }
            <text
              x={ CENTER_X }
              y={ CENTER_Y + 6 }
              textAnchor="middle"
              fontSize="20"
              fontFamily="monospace"
              fontWeight="700"
              fill={ qualityTextColor(qualityPct) }
            >
              { qualityPct % 1 === 0 ? `${ qualityPct }%` : `${ qualityPct.toFixed(1) }%` }
            </text>

            { /* Convergence state label */ }
            <text
              x={ CENTER_X }
              y={ CENTER_Y + 22 }
              textAnchor="middle"
              fontSize="10"
              fontFamily="monospace"
              fill={ TEXT_MUTED }
            >
              { convergenceState }
            </text>
          </g>

          { /* Validator nodes — drawn on top of edges */ }
          { graph.nodes.map((node) => (
            <ValidatorNode
              key={ node.authorityIndex }
              cx={ node.x }
              cy={ node.y }
              radius={ node.radius }
              fill={ node.fill }
              strokeWidth={ node.isProducer ? 2.5 : 1.5 }
              label={ `V${ node.authorityIndex }` }
              isProducer={ node.isProducer }
            />
          )) }
        </svg>
      ) }
    </Box>
  );
};

export default React.memo(MeshNetworkGraph);
