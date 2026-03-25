import type {
  TemporalBlockMetadata,
  TemporalConsensusTime,
  TemporalQueueStats,
  TemporalTxTimestamp,
  TemporalWatermark,
} from 'types/api/temporal';

export const TEMPORAL_WATERMARK: TemporalWatermark = {
  watermark_ns: '1711234567890123456',
  watermark_datetime: '2024-03-24T00:00:00.000Z',
  block_number: 1234567,
};

export const TEMPORAL_CONSENSUS_TIME: TemporalConsensusTime = {
  consensus_time_ns: '1711234567890123456',
  consensus_time_datetime: '2024-03-24T00:00:00.000Z',
  quality_percent: 98.5,
  is_converged: true,
  validator_count: 3,
};

export const TEMPORAL_QUEUE_STATS: TemporalQueueStats = {
  queue_depth: 42,
  total_stamped: 987654,
  avg_wait_ms: 120,
  p95_wait_ms: 450,
  fee_priority_enabled: true,
  inclusion_deadline_secs: 15,
  inclusion_enforce: true,
};

export const TEMPORAL_TX_TIMESTAMP: TemporalTxTimestamp = {
  timestamp_ns: '1711234567890123456',
  timestamp_datetime: '2024-03-23T21:29:27.890Z',
};

export const TEMPORAL_BLOCK_METADATA: TemporalBlockMetadata = {
  block_nano_timestamp: '1711234567890123456',
  block_number: 1234567,
  timestamp_datetime: '2024-03-23T21:29:27.890Z',
};
