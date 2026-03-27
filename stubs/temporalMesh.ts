import type {
  TemporalMeshState,
  TemporalValidatorReport,
  TemporalPairwiseOffset,
} from 'types/api/temporalMesh';

export const TEMPORAL_VALIDATOR_REPORT_0: TemporalValidatorReport = {
  authority_index: 0,
  clock_offset_ns: 120000,
  root_distance_ns: 500000,
  reputation: 9500,
  tier: 'Anchor',
  samples: 1200,
  violation_count: 0,
  last_checkpoint_block: 1234560,
};

export const TEMPORAL_VALIDATOR_REPORT_1: TemporalValidatorReport = {
  authority_index: 1,
  clock_offset_ns: -80000,
  root_distance_ns: 300000,
  reputation: 8200,
  tier: 'Standard',
  samples: 980,
  violation_count: 1,
  last_checkpoint_block: 1234558,
};

export const TEMPORAL_VALIDATOR_REPORT_2: TemporalValidatorReport = {
  authority_index: 2,
  clock_offset_ns: 450000,
  root_distance_ns: 800000,
  reputation: 4500,
  tier: 'Minimal',
  samples: 340,
  violation_count: 3,
  last_checkpoint_block: 1234540,
};

export const TEMPORAL_PAIRWISE_OFFSETS: Array<TemporalPairwiseOffset> = [
  { from_index: 0, to_index: 1, offset_ns: 200000 },
  { from_index: 0, to_index: 2, offset_ns: 330000 },
  { from_index: 1, to_index: 2, offset_ns: 530000 },
];

export const TEMPORAL_MESH_STATE: TemporalMeshState = {
  convergence_state: 'Converged',
  quality_percent: 98.5,
  mesh_diameter_ns: 530000,
  peer_count: 3,
  total_samples: 3520,
  validators: [
    TEMPORAL_VALIDATOR_REPORT_0,
    TEMPORAL_VALIDATOR_REPORT_1,
    TEMPORAL_VALIDATOR_REPORT_2,
  ],
  pairwise_offsets: TEMPORAL_PAIRWISE_OFFSETS,
};

export const TEMPORAL_MESH_STATE_PARTIAL: TemporalMeshState = {
  convergence_state: 'Converging',
  quality_percent: 62.0,
  mesh_diameter_ns: null,
  peer_count: 2,
  total_samples: 800,
  validators: [
    TEMPORAL_VALIDATOR_REPORT_0,
    TEMPORAL_VALIDATOR_REPORT_1,
  ],
  pairwise_offsets: [],
};
