/**
 * Fetch helpers for the Temporal Mesh Dashboard and Validator Time Health pages.
 *
 * The backend endpoints (/api/v2/temporal/mesh-state, /checkpoint,
 * /validators/:index/quality) are being built in parallel with this frontend.
 * Until they land, this module falls back to synthesising mesh state from the
 * already-live temporal_getConsensusTime RPC via /api/v2/temporal/consensus-time.
 *
 * When the backend endpoints become available, replace the fallback blocks in
 * each function with a direct apiFetch call.
 */

import type {
  TemporalMeshState,
  TemporalValidatorReport,
  ConvergenceState,
} from 'types/api/temporalMesh';

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`/api/v2/temporal${ path }`);
  if (!response.ok) {
    throw new Error(`API error: ${ response.status }`);
  }
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Shared pure helpers — exported for testing
// ---------------------------------------------------------------------------

/**
 * Convert reputation basis points (0–10000) to a rounded percentage (0–100).
 * One decimal place is preserved for display precision.
 */
export function reputationToPercent(basisPoints: number): number {
  return Math.round((basisPoints / 10000) * 100 * 10) / 10;
}

/**
 * Format a signed nanosecond offset for display.
 * Automatically scales to µs or ms when the magnitude warrants it.
 */
export function formatOffsetNs(ns: number): string {
  const sign = ns >= 0 ? '+' : '-';
  const abs = Math.abs(ns);
  if (abs >= 1_000_000) {
    return `${ sign }${ (abs / 1_000_000).toFixed(3) } ms`;
  }
  if (abs >= 1_000) {
    return `${ sign }${ (abs / 1_000).toFixed(1) } µs`;
  }
  return `${ sign }${ abs } ns`;
}

/**
 * Format an unsigned nanosecond root distance for display.
 * Scales to µs or ms and appends "from UTC" for context.
 */
export function formatRootDistanceNs(ns: number): string {
  const abs = Math.abs(ns);
  if (abs >= 1_000_000) {
    return `${ (abs / 1_000_000).toFixed(3) } ms from UTC`;
  }
  if (abs >= 1_000) {
    return `${ (abs / 1_000).toFixed(1) } µs from UTC`;
  }
  return `${ abs } ns from UTC`;
}

function toConvergenceState(raw: string): ConvergenceState {
  if (raw === 'Converged') return 'Converged';
  if (raw === 'Converging') return 'Converging';
  return 'Diverged';
}

/**
 * Map a ConvergenceState string to a Chakra colour token.
 */
export function convergenceColor(state: string): string {
  if (state === 'Converged') return 'green.400';
  if (state === 'Converging') return 'yellow.400';
  return 'red.400';
}

/**
 * Map a reputation score (basis points) to a Chakra colour token.
 * >80% → green, >50% → yellow, else → red.
 */
export function reputationColor(basisPoints: number): string {
  const pct = (basisPoints / 10000) * 100;
  if (pct > 80) return 'green.400';
  if (pct > 50) return 'yellow.400';
  return 'red.400';
}

/**
 * Map a quality percentage to a Chakra colour token.
 * >=90% → green, >=70% → yellow, else → red.
 */
export function qualityColor(pct: number): string {
  if (pct >= 90) return 'green.400';
  if (pct >= 70) return 'yellow.400';
  return 'red.400';
}

// ---------------------------------------------------------------------------
// Backend response shapes (intermediate; replace when backend is live)
// ---------------------------------------------------------------------------

interface ConsensusResponse {
  consensusTimeNs: string;
  timeQuality: number;
  convergenceState: string;
  peerCount: number;
}

// Actual shape returned by /api/v2/temporal/validators/:index/quality.
// Field names differ from the polished TemporalValidatorReport — the RPC
// uses raw substrate-runtime names (offsetNs / reputationScore / sampleCount).
// `null` is returned when the validator has no quality report yet (e.g. a
// newly-joined authority before its first checkpoint).
interface ValidatorQualityRawResponse {
  authorityIndex: number;
  offsetNs: string | number;
  rootDistanceNs: number;
  reputationScore: number;
  sampleCount: number;
  lastUpdated: number;
  errorOfSourceNs?: number;
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

/**
 * Producer info extracted from the mesh-state endpoint.
 * Used by the BlockProducerInfo component on the block detail page.
 */
export interface TemporalProducerInfo {

  /** Authority index of the validator that produced the current/latest block. */
  producerAuthorityIndex: number;

  /** Producer's root distance from UTC in nanoseconds. */
  producerRootDistanceNs: number;

  /** Mesh quality percentage at the time of the last block (0–100). */
  qualityPercent: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetch the full mesh state.
 *
 * Primary: GET /api/v2/temporal/mesh-state (pending backend endpoint).
 * Fallback: Synthesises a minimal TemporalMeshState from consensus-time.
 */
export async function fetchTemporalMeshState(): Promise<TemporalMeshState> {
  interface RawPairwiseOffset {
    authorityIndex: number;
    offsetNs: string;
    sampleCount: number;
    rootDistanceNs: string;
    reputationScore: number;
    errorOfSourceNs: string;
  }

  interface RawMeshResponse {
    timeQuality: number;
    convergenceState: string;
    peerCount: number;
    totalSamples: number;
    producerAuthorityIndex: number | null;
    producerRootDistanceNs: string;
    pairwiseOffsets: Array<RawPairwiseOffset>;
  }

  try {
    const data = await apiFetch<RawMeshResponse>('/mesh-state');
    const qualityPct = Math.round((data.timeQuality / 10000) * 100);
    const convergenceState: ConvergenceState = toConvergenceState(data.convergenceState);

    const producerIdx = data.producerAuthorityIndex ?? 0;

    const validators: Array<TemporalValidatorReport> = data.pairwiseOffsets.map((p) => ({
      authority_index: p.authorityIndex,
      clock_offset_ns: parseInt(p.offsetNs, 10) || 0,
      root_distance_ns: parseInt(p.rootDistanceNs, 10) || 0,
      reputation: p.reputationScore,
      tier: 'Standard' as const,
      samples: p.sampleCount,
      violation_count: 0,
      last_checkpoint_block: 0,
    }));

    // Direct offsets: producer → each peer
    const directOffsets = data.pairwiseOffsets.map((p) => ({
      from_index: producerIdx,
      to_index: p.authorityIndex,
      offset_ns: parseInt(p.offsetNs, 10) || 0,
    }));

    // Infer cross-peer offsets: if producer→A = X and producer→B = Y,
    // then A→B ≈ Y - X (transitive offset estimation)
    const inferredOffsets: Array<{ from_index: number; to_index: number; offset_ns: number }> = [];
    for (let i = 0; i < directOffsets.length; i++) {
      for (let j = i + 1; j < directOffsets.length; j++) {
        inferredOffsets.push({
          from_index: directOffsets[i].to_index,
          to_index: directOffsets[j].to_index,
          offset_ns: directOffsets[j].offset_ns - directOffsets[i].offset_ns,
        });
      }
    }

    const pairwiseOffsets = [ ...directOffsets, ...inferredOffsets ];

    const diameter = pairwiseOffsets.length > 0 ?
      Math.max(...pairwiseOffsets.map((p) => Math.abs(p.offset_ns))) :
      null;

    return {
      convergence_state: convergenceState,
      quality_percent: qualityPct,
      mesh_diameter_ns: diameter,
      peer_count: data.peerCount + 1,
      total_samples: data.totalSamples,
      validators,
      pairwise_offsets: pairwiseOffsets,
    };
  } catch {
    const consensus = await apiFetch<ConsensusResponse>('/consensus-time');
    const qualityPct = Math.round((consensus.timeQuality / 10000) * 100);
    const convergenceState: ConvergenceState = toConvergenceState(consensus.convergenceState);

    return {
      convergence_state: convergenceState,
      quality_percent: qualityPct,
      mesh_diameter_ns: null,
      peer_count: consensus.peerCount + 1,
      total_samples: 0,
      validators: [],
      pairwise_offsets: [],
    };
  }
}

/**
 * Fetch producer info for the latest block from the mesh-state endpoint.
 *
 * The mesh-state endpoint always reflects the most recent block producer,
 * making it suitable for displaying producer details on the block detail page.
 * Returns null when the endpoint is unavailable.
 */
export async function fetchTemporalProducerInfo(): Promise<TemporalProducerInfo | null> {
  interface RawPairwiseOffset {
    authorityIndex: number;
    offsetNs: string;
    sampleCount: number;
    rootDistanceNs: string;
    reputationScore: number;
    errorOfSourceNs: string;
  }

  interface RawMeshResponse {
    timeQuality: number;
    convergenceState: string;
    peerCount: number;
    totalSamples: number;
    producerAuthorityIndex: number | null;
    producerRootDistanceNs: string;
    pairwiseOffsets: Array<RawPairwiseOffset>;
  }

  try {
    const data = await apiFetch<RawMeshResponse>('/mesh-state');
    const qualityPercent = Math.round((data.timeQuality / 10000) * 100);
    const producerAuthorityIndex = data.producerAuthorityIndex ?? 0;
    const producerRootDistanceNs = parseInt(data.producerRootDistanceNs, 10) || 0;

    return {
      producerAuthorityIndex,
      producerRootDistanceNs,
      qualityPercent,
    };
  } catch {
    return null;
  }
}

/**
 * Fetch time-health data for a single validator by authority index.
 *
 * Calls GET /api/v2/temporal/validators/:index/quality. Throws when the
 * backend hasn't published a quality report for this validator yet (the
 * RPC returns `null`); callers should handle the error / show a "no
 * report yet" empty state.
 *
 * Derives `tier` from root-distance thresholds (the RPC does not return a
 * tier field) so the existing UI tier badge stays meaningful.
 */
export async function fetchTemporalValidatorQuality(
  index: number,
): Promise<TemporalValidatorReport> {
  const data = await apiFetch<ValidatorQualityRawResponse | null>(
    `/validators/${ index }/quality`,
  );

  if (!data) {
    throw new Error(`No quality report yet for authority ${ index }`);
  }

  const offsetNs = typeof data.offsetNs === 'string' ? parseInt(data.offsetNs, 10) || 0 : (data.offsetNs ?? 0);

  return {
    authority_index: data.authorityIndex,
    clock_offset_ns: offsetNs,
    root_distance_ns: data.rootDistanceNs ?? 0,
    reputation: data.reputationScore ?? 0,
    tier: tierFromRootDistance(data.rootDistanceNs ?? 0),
    samples: data.sampleCount ?? 0,
    violation_count: 0,
    last_checkpoint_block: data.lastUpdated ?? 0,
  };
}

// Tier thresholds mirror node/primitives/src/timesync.rs ClockSource::tier():
// PPS/PHC (sub-µs) ≤ 1µs → Anchor; Timebeat (low-µs) ≤ 50µs → Standard; everything else → Minimal.
function tierFromRootDistance(rootDistanceNs: number): TemporalValidatorReport['tier'] {
  if (rootDistanceNs <= 1_000) return 'Anchor';
  if (rootDistanceNs <= 50_000) return 'Standard';
  return 'Minimal';
}
