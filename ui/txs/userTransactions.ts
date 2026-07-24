import type { Transaction } from 'types/api/transaction';

import type { SubstrateExtrinsic } from 'lib/api/services/general/substrateApi';

export type UserTransactionActivity = |
{ kind: 'evm'; tx: Transaction } |
{ kind: 'substrate'; extrinsic: SubstrateExtrinsic };

function getEthereumTransactionHash(extrinsic: SubstrateExtrinsic): string | null {
  if (extrinsic.pallet !== 'Ethereum' || extrinsic.method !== 'transact') {
    return null;
  }

  const hash = extrinsic.args?.eth_tx_hash;
  return typeof hash === 'string' ? hash.toLowerCase() : null;
}

function getBlockNumber(activity: UserTransactionActivity): number {
  if (activity.kind === 'evm') {
    return activity.tx.block_number ?? Number.MAX_SAFE_INTEGER;
  }

  return activity.extrinsic.block_number;
}

function getPosition(activity: UserTransactionActivity): number {
  if (activity.kind === 'evm') {
    return activity.tx.position ?? 0;
  }

  return activity.extrinsic.index_in_block;
}

/**
 * Combine the EVM and native signed feeds into the user-facing transaction
 * history. Inherents and unsigned extrinsics are chain operations, not user
 * transactions. An Ethereum.transact extrinsic is also omitted when its EVM
 * transaction is already present, so one action cannot appear twice.
 */
export function mergeUserTransactions(
  evmTransactions: Array<Transaction>,
  substrateExtrinsics: Array<SubstrateExtrinsic>,
): Array<UserTransactionActivity> {
  const evmHashes = new Set(evmTransactions.map((tx) => tx.hash.toLowerCase()));

  const nativeActivities: Array<UserTransactionActivity> = substrateExtrinsics
    .filter((extrinsic) => extrinsic.extrinsic_class === 'Signed')
    .filter((extrinsic) => {
      const ethereumHash = getEthereumTransactionHash(extrinsic);
      return !ethereumHash || !evmHashes.has(ethereumHash);
    })
    .map((extrinsic) => ({ kind: 'substrate', extrinsic }));

  return [
    ...evmTransactions.map((tx): UserTransactionActivity => ({ kind: 'evm', tx })),
    ...nativeActivities,
  ].sort((left, right) => {
    const blockDifference = getBlockNumber(right) - getBlockNumber(left);
    return blockDifference || getPosition(right) - getPosition(left);
  });
}
