/**
 * BlockTemporalTimeline
 *
 * Renders an SVG horizontal timeline of all transactions in a block ordered by
 * their nanosecond canonical timestamps.  Each transaction is shown as a dot on
 * the axis; consecutive gaps are labelled and colour-coded by magnitude.
 *
 * Data source: GET /api/v2/temporal/blocks/:blockNumber/timestamps
 * (proxied to temporal_getBlockTransactionTimestamps on the Roko node)
 */

import { Box, Flex, GridItem, Text, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';

import { fetchBlockTransactionTimestamps } from 'lib/api/services/general/temporalRpc';
import type { BlockTxTimestampEntry } from 'lib/api/services/general/temporalRpc';
import { Skeleton } from 'toolkit/chakra/skeleton';
import * as DetailedInfo from 'ui/shared/DetailedInfo/DetailedInfo';

// ---------------------------------------------------------------------------
// Pure utility functions (also tested in BlockTemporalTimeline.spec.ts)
// ---------------------------------------------------------------------------

/**
 * Format a nanosecond gap into a human-readable string with adaptive units.
 */
export function formatGapNs(gapNs: number): string {
  if (gapNs < 1_000) return `${ gapNs } ns`;
  if (gapNs < 1_000_000) return `${ (gapNs / 1_000).toFixed(1) } \u00b5s`;
  if (gapNs < 1_000_000_000) return `${ (gapNs / 1_000_000).toFixed(1) } ms`;
  return `${ (gapNs / 1_000_000_000).toFixed(2) } s`;
}

/**
 * Colour-code a nanosecond gap:
 *   green  — < 1 ms   (sub-millisecond, tight ordering)
 *   yellow — 1–100 ms (moderate gap)
 *   red    — >= 100 ms (large gap)
 */
export function gapColor(gapNs: number): 'green' | 'yellow' | 'red' {
  const MS = 1_000_000;
  if (gapNs < MS) return 'green';
  if (gapNs < 100 * MS) return 'yellow';
  return 'red';
}

const GAP_COLORS: Record<'green' | 'yellow' | 'red', string> = {
  green: '#38a169',
  yellow: '#d69e2e',
  red: '#e53e3e',
};

// ---------------------------------------------------------------------------
// SVG layout constants
// ---------------------------------------------------------------------------

const CHART_W = 800;
const CHART_H = 80;
const AXIS_Y = 50;
const DOT_R = 5;
const INHERENT_R = 3;

// Minimum horizontal pixel separation between dots (for readability).
const MIN_SPREAD_PX = 20;

// ---------------------------------------------------------------------------
// Internal types
// ---------------------------------------------------------------------------

type StampedEntry = BlockTxTimestampEntry & { ts: number };
type PositionedEntry = StampedEntry & { x: number };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return entries that have a valid numeric timestamp, sorted ascending. */
function stampedEntries(entries: Array<BlockTxTimestampEntry>): Array<StampedEntry> {
  return entries
    .filter((e): e is BlockTxTimestampEntry & { timestampNs: string } =>
      e.timestampNs !== null && e.timestampNs !== undefined && e.timestampNs !== '',
    )
    .map((e): StampedEntry => ({ ...e, ts: parseInt(e.timestampNs, 10) }))
    .sort((a, b) => a.ts - b.ts);
}

/** Whether an entry represents a Substrate-only (non-EVM) extrinsic. */
function isInherent(e: BlockTxTimestampEntry): boolean {
  return e.ethHash === null;
}

/** Compute the total span label (first → last stamped timestamp). */
export function totalSpanLabel(entries: Array<{ timestampNs: string | null }>): string | null {
  const valid = entries
    .map(e => e.timestampNs)
    .filter((t): t is string => t !== null && t !== undefined && t !== '');

  if (valid.length < 2) return null;
  const sorted = valid.map(t => parseInt(t, 10)).sort((a, b) => a - b);
  const first = sorted[0]!;
  const last = sorted[sorted.length - 1]!;
  return formatGapNs(last - first);
}

/** Truncate a hex hash to "0x1234...abcd" form. */
function truncateHash(hash: string, chars = 6): string {
  if (hash.length <= chars * 2 + 2) return hash;
  return `${ hash.slice(0, chars + 2) }...${ hash.slice(-chars) }`;
}

/**
 * Map raw positions to spread positions, enforcing a minimum pixel gap
 * between consecutive dots so they never overlap.
 */
function enforceMinSpread(raw: Array<PositionedEntry>): Array<PositionedEntry> {
  const result: Array<PositionedEntry> = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i]!;
    if (i === 0) {
      result.push(item);
    } else {
      const prev = result[i - 1]!;
      result.push({ ...item, x: Math.max(item.x, prev.x + MIN_SPREAD_PX) });
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// SVG Timeline
// ---------------------------------------------------------------------------

interface TimelineProps {
  entries: Array<BlockTxTimestampEntry>;
  blockNumber: number;
}

const TimelineSvg: React.FC<TimelineProps> = ({ entries, blockNumber }) => {
  const router = useRouter();

  const stamped = stampedEntries(entries);

  if (stamped.length === 0) {
    return (
      <Flex h="80px" alignItems="center" justifyContent="center">
        <Text fontSize="sm" color="text.secondary">No temporally-stamped transactions in this block</Text>
      </Flex>
    );
  }

  const minTs = stamped[0]!.ts;
  const maxTs = stamped[stamped.length - 1]!.ts;
  const range = maxTs - minTs || 1;

  // Map a number timestamp to SVG x coordinate [DOT_R, CHART_W - DOT_R].
  const toX = (ts: number): number => {
    const ratio = (ts - minTs) / range;
    return DOT_R + ratio * (CHART_W - 2 * DOT_R);
  };

  const rawPositions: Array<PositionedEntry> = stamped.map(e => ({ ...e, x: toX(e.ts) }));
  const positions = enforceMinSpread(rawPositions);

  const handleDotClick = (entry: BlockTxTimestampEntry) => {
    if (entry.ethHash) {
      void router.push({ pathname: '/tx/[hash]', query: { hash: entry.ethHash } });
    }
  };

  return (
    <svg
      width="100%"
      height={ CHART_H }
      viewBox={ `0 0 ${ CHART_W } ${ CHART_H }` }
      preserveAspectRatio="xMidYMid meet"
      aria-label={ `Temporal transaction ordering timeline for block ${ blockNumber }` }
    >
      { /* Axis line */ }
      <line x1={ 0 } y1={ AXIS_Y } x2={ CHART_W } y2={ AXIS_Y } stroke="#CBD5E0" strokeWidth="1.5"/>

      { /* Gap labels between consecutive stamped dots */ }
      { positions.map((pos, i) => {
        if (i === 0) return null;
        const prev = positions[i - 1]!;
        const gap = stamped[i]!.ts - stamped[i - 1]!.ts;
        const label = formatGapNs(gap);
        const color = GAP_COLORS[gapColor(gap)];
        const midX = (prev.x + pos.x) / 2;
        return (
          <text
            key={ `gap-${ i }` }
            x={ midX }
            y={ AXIS_Y - 10 }
            textAnchor="middle"
            fontSize="9"
            fill={ color }
            fontFamily="monospace"
          >
            { label }
          </text>
        );
      }) }

      { /* Transaction dots and labels */ }
      { positions.map((pos, i) => {
        const entry = stamped[i]!;
        const inherent = isInherent(entry);
        const r = inherent ? INHERENT_R : DOT_R;
        const fill = inherent ? '#A0AEC0' : '#3182CE';
        const hash = entry.ethHash ?? entry.substrateHash;
        const label = truncateHash(hash, 4);
        const clickable = !inherent;

        return (
          <g
            key={ `dot-${ entry.substrateHash }-${ i }` }
            style={ clickable ? { cursor: 'pointer' } : undefined }
            onClick={ clickable ? () => handleDotClick(entry) : undefined }
            role={ clickable ? 'link' : undefined }
            aria-label={ clickable ? `Navigate to transaction ${ hash }` : undefined }
          >
            { /* Dot */ }
            <circle cx={ pos.x } cy={ AXIS_Y } r={ r } fill={ fill }/>
            { /* Hash label below axis */ }
            <text
              x={ pos.x }
              y={ AXIS_Y + 16 }
              textAnchor="middle"
              fontSize="8"
              fill={ inherent ? '#A0AEC0' : '#2D3748' }
              fontFamily="monospace"
            >
              { label }
            </text>
          </g>
        );
      }) }

      { /* Single-dot case: show a label above the dot */ }
      { stamped.length === 1 && positions[0] && (
        <text
          x={ positions[0].x }
          y={ AXIS_Y - 12 }
          textAnchor="middle"
          fontSize="9"
          fill="#718096"
          fontFamily="monospace"
        >
          single tx
        </text>
      ) }
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  blockNumber: number;
}

const BlockTemporalTimeline: React.FC<Props> = ({ blockNumber }) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'temporal_block_tx_timestamps', blockNumber ],
    queryFn: () => fetchBlockTransactionTimestamps(blockNumber),
    retry: false,
    // Block data is immutable once finalised.
    staleTime: Infinity,
  });

  // Don't render anything if the API failed — the block page should still work.
  if (isError) return null;

  const spanLabel = data ? totalSpanLabel(data) : null;

  return (
    <>
      <DetailedInfo.ItemLabel
        hint="Nanosecond-precision ordering of transactions within this block, derived from temporal timestamps assigned at pool receipt"
        isLoading={ isLoading }
        gridColumn={{ base: undefined, lg: '1 / 3' }}
      >
        Temporal ordering
      </DetailedInfo.ItemLabel>
      <GridItem colSpan={{ base: undefined, lg: 2 }}>
        <Skeleton loading={ isLoading } borderRadius="md">
          { data && data.length === 0 ? (
            <Flex
              borderWidth="1px"
              borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.200' }}
              borderRadius="md"
              p={ 3 }
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="sm" color="text.secondary">
                No temporal transactions in this block
              </Text>
            </Flex>
          ) : (
            <Box
              borderWidth="1px"
              borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.200' }}
              borderRadius="md"
              p={ 3 }
              overflow="hidden"
            >
              { spanLabel && (
                <Flex justifyContent="space-between" mb={ 1 }>
                  <chakra.span fontSize="xs" color="text.secondary">
                    Transaction ordering timeline
                  </chakra.span>
                  <Flex gap={ 3 } alignItems="center">
                    <chakra.span fontSize="xs" color="text.secondary">
                      Total span:{ ' ' }
                      <chakra.span fontFamily="mono" color="text.primary">
                        { spanLabel }
                      </chakra.span>
                    </chakra.span>
                    <Flex gap={ 2 } alignItems="center">
                      <chakra.span fontSize="10px" color="text.secondary">
                        <chakra.span
                          display="inline-block"
                          w="8px"
                          h="8px"
                          borderRadius="full"
                          bg="#3182CE"
                          mr="4px"
                          verticalAlign="middle"
                        />
                        EVM
                      </chakra.span>
                      <chakra.span fontSize="10px" color="text.secondary">
                        <chakra.span
                          display="inline-block"
                          w="6px"
                          h="6px"
                          borderRadius="full"
                          bg="#A0AEC0"
                          mr="4px"
                          verticalAlign="middle"
                        />
                        inherent
                      </chakra.span>
                    </Flex>
                  </Flex>
                </Flex>
              ) }
              { data && (
                <TimelineSvg entries={ data } blockNumber={ blockNumber }/>
              ) }
              { /* Gap colour legend */ }
              <Flex gap={ 4 } mt={ 1 } justifyContent="flex-end">
                { ([ [ '#38a169', '< 1 ms' ], [ '#d69e2e', '1\u2013100 ms' ], [ '#e53e3e', '\u2265 100 ms' ] ] as const).map(([ color, label ]) => (
                  <chakra.span key={ label } fontSize="10px" color="text.secondary">
                    <chakra.span
                      display="inline-block"
                      w="24px"
                      h="2px"
                      bg={ color }
                      mr="4px"
                      verticalAlign="middle"
                    />
                    { label }
                  </chakra.span>
                )) }
              </Flex>
            </Box>
          ) }
        </Skeleton>
      </GridItem>
    </>
  );
};

export default React.memo(BlockTemporalTimeline);
