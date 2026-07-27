// Fetch temporal data from the Blockscout backend API.
// The backend proxies calls to the Roko node's JSON-RPC endpoint.

import type {
  TemporalBlockMetadata,
  TemporalConsensusTime,
  TemporalMetrics,
  TemporalQueueStats,
  TemporalTxTimestamp,
  TemporalWatermark,
} from 'src/features/temporal/types/api';
import { nanoToDatetime } from 'src/features/temporal/utils/formatNanoTimestamp';

async function apiFetch<T>(path: string): Promise<T> {
  const response = await fetch(`/api/v2/temporal${ path }`);
  if (!response.ok) {
    throw new Error(`API error: ${ response.status }`);
  }
  return response.json() as Promise<T>;
}

function nsToDatetime(ns: string | number): string {
  return nanoToDatetime(String(ns));
}

// Backend returns: { current_watermark: number, last_update_block: number|null }
interface WatermarkResponse {
  current_watermark: string | number;
  last_update_block: number | null;
}

export async function fetchTemporalWatermark(): Promise<TemporalWatermark> {
  const result = await apiFetch<WatermarkResponse>('/watermark');
  const watermarkNs = String(result.current_watermark);
  const isEstablished = watermarkNs !== '0';
  return {
    watermark_ns: watermarkNs,
    watermark_datetime: isEstablished ? nsToDatetime(watermarkNs) : '',
    block_number: result.last_update_block ?? 0,
  };
}

// Backend returns: { consensusTimeNs: string, timeQuality: number, convergenceState: string, peerCount: number, consensusOffsetNs: string }
interface ConsensusResponse {
  consensusTimeNs: string;
  timeQuality: number;
  convergenceState: string;
  peerCount: number;
}

export async function fetchTemporalConsensusTime(): Promise<TemporalConsensusTime> {
  const result = await apiFetch<ConsensusResponse>('/consensus-time');
  const timeNs = parseInt(result.consensusTimeNs, 10) || 0;
  const qualityPct = Math.round((result.timeQuality / 10000) * 100);
  return {
    consensus_time_ns: result.consensusTimeNs,
    consensus_time_datetime: nsToDatetime(timeNs),
    quality_percent: qualityPct,
    is_converged: result.convergenceState === 'Converged',
    mesh_node_count: result.peerCount + 1,
  };
}

// Backend returns: { enabled: boolean, queueDepth: number, totalStamped: number, avgWaitNs: string, p50WaitNs: string, p95WaitNs: string, maxWaitNs: string }
interface QueueResponse {
  enabled: boolean;
  queueDepth: number;
  totalStamped: number;
  avgWaitNs: string;
  p95WaitNs: string;
}

function nsStrToMs(nsStr: string): number {
  const ns = parseInt(nsStr, 10);
  return isNaN(ns) ? 0 : Math.round(ns / 1_000_000);
}

export async function fetchTemporalQueueStats(): Promise<TemporalQueueStats> {
  const result = await apiFetch<QueueResponse>('/queue-stats');
  return {
    queue_depth: result.queueDepth,
    total_stamped: result.totalStamped,
    avg_wait_ms: nsStrToMs(result.avgWaitNs),
    p95_wait_ms: nsStrToMs(result.p95WaitNs),
    fee_priority_enabled: result.enabled,
    inclusion_deadline_secs: 15,
    inclusion_enforce: true,
  };
}

// Backend returns: { timestamp_ns, hash, wait_ns, arrival_ns, priority, queue_position }
interface TxTimestampResponse {
  timestamp_ns: string | null;
  hash: string;
  wait_ns?: string | null;
  arrival_ns?: string | null;
  priority?: number | null;
  queue_position?: number | null;
}

export async function fetchTemporalTxTimestamp(txHash: string): Promise<TemporalTxTimestamp> {
  const result = await apiFetch<TxTimestampResponse>(`/transactions/${ txHash }/timestamp`);
  return {
    timestamp_ns: result.timestamp_ns ?? '',
    timestamp_datetime: result.timestamp_ns ? nanoToDatetime(result.timestamp_ns) : '',
    wait_ns: result.wait_ns ?? undefined,
    arrival_ns: result.arrival_ns ?? undefined,
    priority: result.priority ?? undefined,
    queue_position: result.queue_position,
  };
}

// Backend returns: { block_nano_timestamp: string, block_number: number, miner_key_id?: number }
interface BlockMetadataResponse {
  block_nano_timestamp: string;
  block_number: number;
  miner_key_id?: number | null;
}

export async function fetchTemporalBlockMetadata(blockNumber: number): Promise<TemporalBlockMetadata> {
  const result = await apiFetch<BlockMetadataResponse>(`/blocks/${ blockNumber }/metadata`);
  return {
    block_nano_timestamp: result.block_nano_timestamp,
    block_number: result.block_number,
    timestamp_datetime: nanoToDatetime(result.block_nano_timestamp),
    miner_key_id: result.miner_key_id ?? null,
  };
}

// One entry per extrinsic/transaction in the block.
// ethHash is null for Substrate-only (non-EVM) transactions such as inherents.
// timestampNs is null for transactions that were not temporally stamped.
export interface BlockTxTimestampEntry {
  substrateHash: string;
  ethHash: string | null;
  timestampNs: string | null;
  index: number;
}

export async function fetchBlockTransactionTimestamps(blockNumber: number): Promise<Array<BlockTxTimestampEntry>> {
  return apiFetch<Array<BlockTxTimestampEntry>>(`/blocks/${ blockNumber }/timestamps`);
}

// Backend returns the raw JSON from temporal_getTemporalMetrics.
// Numeric values arrive as strings from the Rust u64 fields.
interface MetricsResponse {
  totalTemporalTransactions: string;
  totalValidationFailures: string;
  totalOrderingViolations: string;
  activeTemporalKeys: string;
  expiredTransactionsCleaned: string;
}

export async function fetchTemporalMetrics(): Promise<TemporalMetrics> {
  // Combine on-chain metrics with live queue stats for accurate counts.
  // The on-chain TemporalMetricsStorage may not be updated for all tx types,
  // so we use the queue's totalStamped as the authoritative tx count.
  const [ metricsResult, queueResult ] = await Promise.all([
    apiFetch<MetricsResponse>('/metrics').catch(() => null),
    apiFetch<QueueResponse>('/queue-stats').catch(() => null),
  ]);

  const onChainTxs = parseInt(metricsResult?.totalTemporalTransactions ?? '0', 10) || 0;
  const queueTxs = queueResult?.totalStamped ?? 0;

  return {
    total_temporal_transactions: Math.max(onChainTxs, queueTxs),
    total_validation_failures: parseInt(metricsResult?.totalValidationFailures ?? '0', 10) || 0,
    total_ordering_violations: parseInt(metricsResult?.totalOrderingViolations ?? '0', 10) || 0,
    active_temporal_keys: parseInt(metricsResult?.activeTemporalKeys ?? '0', 10) || 0,
    expired_transactions_cleaned: parseInt(metricsResult?.expiredTransactionsCleaned ?? '0', 10) || 0,
  };
}
