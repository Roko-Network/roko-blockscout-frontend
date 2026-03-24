// Direct RPC calls to Roko node for temporal data.
// Used when the Blockscout backend doesn't have the temporal endpoints.

import type { TemporalWatermark, TemporalConsensusTime, TemporalQueueStats } from 'types/api/temporal';

const RPC_URL = process.env.NEXT_PUBLIC_NETWORK_RPC_URL || 'https://roko-testnetv2.ntfork.com';

interface JsonRpcResponse {
  jsonrpc: string;
  id: number;
  result?: unknown;
  error?: { code: number; message: string };
}

async function rpcCall<T>(method: string, params: Array<unknown> = []): Promise<T> {
  const response = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: 1 }),
  });
  const json = await response.json() as JsonRpcResponse;
  if (json.error) {
    throw new Error(json.error.message || 'RPC error');
  }
  return json.result as T;
}

interface WatermarkRpcResult {
  current_watermark: number;
  last_update_block: number | null;
}

interface QueueStatsRpcResult {
  enabled: boolean;
  queueDepth: number;
  totalStamped: number;
  avgWaitNs: string;
  p50WaitNs: string;
  p95WaitNs: string;
  maxWaitNs: string;
}

interface ConsensusTimeRpcResult {
  consensusTimeNs: string;
  timeQuality: number;
  convergenceState: string;
  peerCount: number;
}

function nsToDatetime(ns: number): string {
  return new Date(ns / 1_000_000).toISOString();
}

function nsToMs(nsStr: string): number {
  const ns = parseInt(nsStr, 10);
  return isNaN(ns) ? 0 : Math.round(ns / 1_000_000);
}

export async function fetchTemporalWatermark(): Promise<TemporalWatermark> {
  const result = await rpcCall<WatermarkRpcResult>('temporal_getWatermarkInfo');
  return {
    watermark_ns: String(result.current_watermark),
    watermark_datetime: nsToDatetime(result.current_watermark),
    block_number: result.last_update_block ?? 0,
  };
}

export async function fetchTemporalConsensusTime(): Promise<TemporalConsensusTime> {
  const result = await rpcCall<ConsensusTimeRpcResult>('temporal_getConsensusTime');
  const timeNs = parseInt(result.consensusTimeNs, 10) || 0;
  const qualityPct = Math.round((result.timeQuality / 10000) * 100);
  return {
    consensus_time_ns: result.consensusTimeNs,
    consensus_time_datetime: nsToDatetime(timeNs),
    quality_percent: qualityPct,
    is_converged: result.convergenceState === 'Converged',
    validator_count: result.peerCount + 1,
  };
}

export async function fetchTemporalQueueStats(): Promise<TemporalQueueStats> {
  const result = await rpcCall<QueueStatsRpcResult>('temporal_getQueueStats');
  return {
    queue_depth: result.queueDepth,
    total_stamped: result.totalStamped,
    avg_wait_ms: nsToMs(result.avgWaitNs),
    p95_wait_ms: nsToMs(result.p95WaitNs),
    fee_priority_enabled: result.enabled,
    inclusion_deadline_secs: 15,
    inclusion_enforce: true,
  };
}
