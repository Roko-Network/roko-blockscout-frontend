// SPDX-License-Identifier: LicenseRef-Blockscout

export interface RpcParam {
  name: string;
  type: string;
  isOptional?: boolean;
}
export interface RpcGuide {
  description: string;
  params: Array<RpcParam>;
  type: string;
}
const at: RpcParam = { name: 'at', type: 'BlockHash', isOptional: true };
const block: RpcParam = { name: 'block_number', type: 'u32' };
const tx: RpcParam = { name: 'tx_hash', type: 'H256' };
const authority: RpcParam = { name: 'authority_index', type: 'u32' };
// Signatures verified against node/rpc/src/temporal.rs, source 086baf26.
export const TEMPORAL_GUIDES: Record<string, RpcGuide> = {
  temporal_getWatermarkInfo: {
    description: 'Temporal watermark at the selected block, or the latest state.',
    params: [ at ],
    type: 'TemporalWatermarkInfo',
  },
  temporal_getBlockMetadata: {
    description: 'Temporal metadata for a block number. Pruned or unrecorded data can return null.',
    params: [ block, at ],
    type: 'Option<TemporalBlockMetadata>',
  },
  temporal_getBlocksMetadata: {
    description: 'Temporal metadata for a JSON array of block numbers.',
    params: [ { name: 'block_numbers', type: 'Vec<u32>' }, at ],
    type: 'Vec<(u32, Option<TemporalBlockMetadata>)>',
  },
  temporal_getConsensusTime: {
    description: 'Mesh consensus time in nanoseconds and quality metrics.',
    params: [],
    type: 'ConsensusTimeInfo',
  },
  temporal_getTransactionTimestamp: {
    description: 'Canonical timestamp for a Substrate extrinsic hash or Ethereum transaction hash. Missing data returns null.',
    params: [ tx ],
    type: 'Option<String>',
  },
  temporal_getBlockTransactionTimestamps: {
    description: 'Transaction timestamps for a block number, in extrinsic order.',
    params: [ { ...block, type: 'u64' } ],
    type: 'Vec<TransactionTimestampInfo>',
  },
  temporal_getQueueStats: {
    description: 'Current timestamping queue depth and wait statistics.',
    params: [],
    type: 'QueueStats',
  },
  temporal_getTransactionWaitTime: {
    description: 'Wait information for a queued or stamped transaction hash.',
    params: [ tx ],
    type: 'TransactionWaitTime',
  },
  temporal_getRecentWaitTimes: {
    description: 'Recent stamped transaction wait times. Start with a small count such as 10.',
    params: [ { name: 'count', type: 'u32' } ],
    type: 'Vec<TransactionWaitTime>',
  },
  temporal_getValidatorTimeQuality: {
    description:
      'Time quality for a zero-based authority index. Use the current Session.Validators order; this is not an account address. Missing data returns null.',
    params: [ authority ],
    type: 'Option<ValidatorTimeQualityInfo>',
  },
  temporal_getViolations: {
    description:
      'Violation history for a zero-based authority index in the current Session.Validators order. Missing data returns null.',
    params: [ authority ],
    type: 'Option<ViolationTrackerInfo>',
  },
  temporal_getMeshState: {
    description: 'Live mesh snapshot from the RPC server node’s perspective. Returns null if no snapshot is available.',
    params: [],
    type: 'Option<MeshStateInfo>',
  },
  temporal_getValidatorReadiness: {
    description: 'Public readiness report for the RPC server node. This does not inspect your own validator.',
    params: [],
    type: 'ValidatorReadinessInfo',
  },
  temporal_getCheckpoint: {
    description: 'Latest time-health checkpoint, recorded every 100 blocks. Returns null if none exists.',
    params: [],
    type: 'Option<CheckpointInfo>',
  },
  temporal_getTemporalMetrics: {
    description: 'Cumulative temporal processing metrics.',
    params: [],
    type: 'TemporalMetricsInfo',
  },
};

export function parameterHelp(param: RpcParam): string {
  if (/Hash|H256/.test(param.type))
    return 'A 32-byte hash: 0x followed by 64 hexadecimal characters. Copy a transaction hash from its explorer page; block hashes identify a specific block.';
  if (param.name === 'authority_index')
    return 'Zero-based position in the current validator set. Open Chain State → Session → Validators to find the order.';
  if (/^u\d+$/.test(param.type) || /BlockNumber/.test(param.type))
    return 'An unsigned whole number, without commas. For block numbers, use the finalized-block helper or copy a number from the explorer.';
  if (/Vec|\[/.test(param.type)) return 'Enter a JSON array, for example [1,2,3].';
  if (/Account|Address/.test(param.type))
    return 'Copy the public account address from the explorer. Never enter a seed phrase or private key.';
  return 'Enter the value in the displayed RPC type. Structured values use JSON.';
}

interface Registry {
  createType: (type: string, value: unknown) => { toJSON: () => unknown };
}
export function parseRpcParams(
  registry: Registry,
  guide: RpcGuide | undefined,
  values: Array<string>,
  raw?: string,
): Array<unknown> {
  let params: Array<unknown>;
  if (raw !== undefined) {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) throw new Error('Parameters must be a JSON array.');
    params = parsed;
  } else {
    params = (guide?.params ?? []).map((p, i) => {
      const value = values[i]?.trim() ?? '';
      if (!value && p.isOptional) return null;
      if (!value) throw new Error(`${ p.name }: Enter a value.`);
      return /^(?:Vec<|\[|\()|^(?:bool|u\d+|BlockNumber)/.test(p.type) ? JSON.parse(value) : value;
    });
    while (params.length && params[params.length - 1] === null) params.pop();
  }
  const checkNumbers = (value: unknown): void => {
    if (typeof value === 'number' && !Number.isSafeInteger(value))
      throw new Error('Use exact integer values; unsafe numbers and fractions are not supported.');
    if (Array.isArray(value)) value.forEach(checkNumbers);
    else if (value && typeof value === 'object') Object.values(value).forEach(checkNumbers);
  };
  params.forEach(checkNumbers);
  if (!guide) return params;
  if (params.length > guide.params.length) throw new Error(`Expected at most ${ guide.params.length } parameters.`);
  guide.params.forEach((p, i) => {
    const value = params[i];
    if (value === undefined || value === null) {
      if (!p.isOptional) throw new Error(`${ p.name }: Enter a value.`);
      return;
    }
    if (/Hash|H256/.test(p.type) && (typeof value !== 'string' || !/^0x[0-9a-fA-F]{64}$/.test(value))) {
      throw new Error(`${ p.name }: Use a 32-byte 0x-prefixed hash.`);
    }
    if (/^u\d+$/.test(p.type) && (typeof value !== 'number' || value < 0 || BigInt(value) >= BigInt(2) ** BigInt(p.type.slice(1)))) {
      throw new Error(`${ p.name }: Enter a non-negative ${ p.type } integer within range.`);
    }
    try {
      registry.createType(p.type, value);
    } catch {
      throw new Error(`${ p.name }: Value does not match ${ p.type }.`);
    }
  });
  return params;
}
