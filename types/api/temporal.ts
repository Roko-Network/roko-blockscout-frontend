export type TemporalWatermark = {
  // Nanosecond timestamp as a string (too large for JS number)
  watermark_ns: string;
  // ISO 8601 datetime string derived from the watermark
  watermark_datetime: string;
  // Block number at which the watermark was set
  block_number: number;
};

export type TemporalConsensusTime = {
  // Nanosecond consensus mesh time as a string
  consensus_time_ns: string;
  // ISO 8601 datetime string
  consensus_time_datetime: string;
  // Quality as a percentage (0–100)
  quality_percent: number;
  // Whether mesh convergence has been achieved
  is_converged: boolean;
  // Number of validators participating in mesh
  validator_count: number;
};

export type TemporalQueueStats = {
  // Number of transactions currently in the stamping queue
  queue_depth: number;
  // Total transactions stamped since node start
  total_stamped: number;
  // Average wait time in milliseconds (p50)
  avg_wait_ms: number;
  // p95 wait time in milliseconds
  p95_wait_ms: number;
  // Whether fee-priority ordering is enabled
  fee_priority_enabled: boolean;
  // Inclusion deadline in seconds
  inclusion_deadline_secs: number;
  // Whether inclusion enforcement is active
  inclusion_enforce: boolean;
};

export type TemporalTxTimestamp = {
  // Nanosecond canonical timestamp for the transaction (string to avoid precision loss)
  timestamp_ns: string;
  // ISO 8601 datetime derived from the nanosecond timestamp
  timestamp_datetime: string;
};

export type TemporalBlockMetadata = {
  // Nanosecond block-level temporal timestamp (string to avoid precision loss)
  block_nano_timestamp: string;
  // Block number
  block_number: number;
  // ISO 8601 datetime derived from the nanosecond timestamp
  timestamp_datetime: string;
};
