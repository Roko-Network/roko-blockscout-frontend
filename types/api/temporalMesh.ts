/**
 * Types for the Temporal Mesh Dashboard and Validator Time Health pages.
 *
 * These types model the data returned by:
 *   GET /api/v2/temporal/mesh-state
 *   GET /api/v2/temporal/checkpoint
 *   GET /api/v2/temporal/validators/:index/quality
 *
 * While the backend endpoints are being built, the frontend fetches directly
 * from the Roko node RPC (temporal_getConsensusTime) and supplements missing
 * fields with null/default values.
 */

/** Tier classification for a validator's time health. */
export type ValidatorTier = 'Anchor' | 'Standard' | 'Minimal';

/** Convergence state of the mesh. */
export type ConvergenceState = 'Converged' | 'Converging' | 'Diverged';

/**
 * Per-validator time health report.
 * Sourced from: temporal_getCheckpoint (not yet live — may be null).
 */
export type TemporalValidatorReport = {
  /** Authority index in the validator set. */
  authority_index: number;
  /** Signed clock offset from mesh consensus (nanoseconds). */
  clock_offset_ns: number;
  /** Distance to UTC root clock (nanoseconds). */
  root_distance_ns: number;
  /**
   * Reputation score in basis points (0–10000).
   * 10000 = perfect, maps to 100%.
   */
  reputation: number;
  /** Tier classification. */
  tier: ValidatorTier;
  /** Number of PTP samples contributed. */
  samples: number;
  /** Number of consecutive excessive-offset violations. */
  violation_count: number;
  /** Block number of the last checkpoint. */
  last_checkpoint_block: number;
};

/** Pairwise clock offset between two validators (nanoseconds). */
export type TemporalPairwiseOffset = {
  from_index: number;
  to_index: number;
  offset_ns: number;
};

/**
 * Full mesh state used by the Mesh Dashboard page.
 * Synthesised from temporal_getConsensusTime + temporal_getMeshState (pending).
 */
export type TemporalMeshState = {
  /** Whether the mesh has achieved temporal consensus. */
  convergence_state: ConvergenceState;
  /** Mesh time quality (0–100%). */
  quality_percent: number;
  /**
   * Maximum pairwise clock offset between any two validators (nanoseconds).
   * Null when fewer than 2 validators are reporting.
   */
  mesh_diameter_ns: number | null;
  /** Number of validators actively participating in the mesh. */
  peer_count: number;
  /** Total PTP samples exchanged across all validator pairs. */
  total_samples: number;
  /** Per-validator reports (may be empty while backend endpoints are pending). */
  validators: Array<TemporalValidatorReport>;
  /** All pairwise offsets (may be empty while backend endpoints are pending). */
  pairwise_offsets: Array<TemporalPairwiseOffset>;
};
