import type { schemas } from '@blockscout/api-types';

import type { SubstrateExtrinsic } from 'src/features/substrate/api/substrate-api';

import { describe, expect, it } from 'vitest';

import { mergeUserTransactions } from './user-transactions';

const evm = (hash: string, blockNumber: number): schemas['Transaction'] => ({
  hash,
  block_number: blockNumber,
  position: 0,
} as schemas['Transaction']);

const extrinsic = (
  extrinsicClass: SubstrateExtrinsic['extrinsic_class'],
  blockNumber: number,
  overrides: Partial<SubstrateExtrinsic> = {},
): SubstrateExtrinsic => ({
  id: blockNumber,
  block_number: blockNumber,
  block_timestamp: '2026-07-29T12:00:00.000000Z',
  block_hash: null,
  index_in_block: 3,
  pallet: 'Staking',
  method: 'payout_stakers',
  args: null,
  args_truncated: false,
  signer: '5validator',
  signature: '0x01',
  tip: '0',
  era: null,
  nonce: 0,
  fee_paid: '0',
  success: true,
  error: null,
  hash: `0x${ blockNumber.toString(16).padStart(64, '0') }`,
  call_hash: null,
  extrinsic_class: extrinsicClass,
  ...overrides,
});

describe('mergeUserTransactions', () => {
  it('shows four EVM transactions and one signed payout as five user transactions', () => {
    const result = mergeUserTransactions(
      [
        evm('0x01', 9110),
        evm('0x02', 6097),
        evm('0x03', 6096),
        evm('0x04', 6094),
      ],
      [ extrinsic('Signed', 28964) ],
    );

    expect(result).toHaveLength(5);
    expect(result.map((activity) => activity.kind)).toEqual([
      'substrate',
      'evm',
      'evm',
      'evm',
      'evm',
    ]);
  });

  it('excludes inherent and unsigned chain operations', () => {
    const result = mergeUserTransactions(
      [],
      [
        extrinsic('Inherent', 10),
        extrinsic('Unsigned', 9),
        extrinsic('Signed', 8),
      ],
    );

    expect(result).toHaveLength(1);
    expect(result[0]?.kind).toBe('substrate');
  });

  it('does not duplicate an Ethereum extrinsic already represented by an EVM transaction', () => {
    const hash = '0xabcdef';
    const result = mergeUserTransactions(
      [ evm(hash, 10) ],
      [
        extrinsic('Signed', 10, {
          pallet: 'Ethereum',
          method: 'transact',
          args: { eth_tx_hash: hash.toUpperCase() },
        }),
      ],
    );

    expect(result).toEqual([ { kind: 'evm', tx: expect.objectContaining({ hash }) } ]);
  });
});
