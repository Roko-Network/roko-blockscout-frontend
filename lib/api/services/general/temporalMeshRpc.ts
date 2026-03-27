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

// ---------------------------------------------------------------------------
// Backend response shapes (intermediate; replace when backend is live)
// ---------------------------------------------------------------------------

interface ConsensusResponse {
  consensusTimeNs: string;
  timeQuality: number;
  convergenceState: string;
  peerCount: number;
}

interface MeshStateResponse {
  convergenceState: string;
  qualityPct: number;
  meshDiameterNs: number | null;
  peerCount: number;
  totalSamples: number;
  validators: Array<{
    authorityIndex: number;
    clockOffsetNs: number;
    rootDistanceNs: number;
    reputation: number;
    tier: string;
    samples: number;
    violationCount: number;
    lastCheckpointBlock: number;
  }>;
  pairwiseOffsets: Array<{
    fromIndex: number;
    toIndex: number;
    offsetNs: number;
  }>;
}

interface ValidatorQualityResponse {
  authorityIndex: number;
  clockOffsetNs: number;
  rootDistanceNs: number;
  reputation: number;
  tier: string;
  samples: number;
  violationCount: number;
  lastCheckpointBlock: number;
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
  // Try the dedicated mesh-state endpoint first.
  try {
    const data = await apiFetch<MeshStateResponse>('/mesh-state');
    return {
      convergence_state: data.convergenceState as ConvergenceState,
      quality_percent: data.qualityPct,
      mesh_diameter_ns: data.meshDiameterNs,
      peer_count: data.peerCount,
      total_samples: data.totalSamples,
      validators: data.validators.map((v) => ({
        authority_index: v.authorityIndex,
        clock_offset_ns: v.clockOffsetNs,
        root_distance_ns: v.rootDistanceNs,
        reputation: v.reputation,
        tier: v.tier as TemporalValidatorReport['tier'],
        samples: v.samples,
        violation_count: v.violationCount,
        last_checkpoint_block: v.lastCheckpointBlock,
      })),
      pairwise_offsets: data.pairwiseOffsets.map((p) => ({
        from_index: p.fromIndex,
        to_index: p.toIndex,
        offset_ns: p.offsetNs,
      })),
    };
  } catch {
    // Fallback: synthesise from consensus-time (always available).
    const consensus = await apiFetch<ConsensusResponse>('/consensus-time');
    const qualityPct = Math.round((consensus.timeQuality / 10000) * 100);
    const convergenceState: ConvergenceState =
      consensus.convergenceState === 'Converged' ? 'Converged' :
      consensus.convergenceState === 'Converging' ? 'Converging' : 'Diverged';

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
 * Fetch time-health data for a single validator by authority index.
 *
 * Primary: GET /api/v2/temporal/validators/:index/quality (pending).
 * Returns null when unavailable.
 */
export async function fetchTemporalValidatorQuality(
  index: number,
): Promise<TemporalValidatorReport> {
  const data = await apiFetch<ValidatorQualityResponse>(
    `/validators/${ index }/quality`,
  );
  return {
    authority_index: data.authorityIndex,
    clock_offset_ns: data.clockOffsetNs,
    root_distance_ns: data.rootDistanceNs,
    reputation: data.reputation,
    tier: data.tier as TemporalValidatorReport['tier'],
    samples: data.samples,
    violation_count: data.violationCount,
    last_checkpoint_block: data.lastCheckpointBlock,
  };
}
