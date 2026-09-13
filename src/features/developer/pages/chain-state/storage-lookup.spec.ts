// SPDX-License-Identifier: LicenseRef-Blockscout

import { ApiPromise, HttpProvider } from '@polkadot/api';

import { describe, expect, it } from 'vitest';

import { describeKey, parseLookupKeys } from './storage-lookup';

class OfflineProvider extends HttpProvider {
  get isConnected() {
    return false;
  }
}
const registry = new ApiPromise({ provider: new OfflineProvider('http://127.0.0.1:1') }).registry;
const block = describeKey('u32', 'TimeSync', 'BlockTimeQuality', 0);

describe('storage lookup inputs', () => {
  it('explains block keys and prevents an empty lookup', () => {
    expect(block.label).toBe('Block number');
    expect(() => parseLookupKeys(registry, [ block ], [])).toThrow('Block number: Enter a value');
    expect(parseLookupKeys(registry, [ block ], [ '1189538' ])).toEqual([ '1189538' ]);
  });
  it('rejects negative, fractional, and overflowing unsigned integers', () => {
    for (const value of [ '-1', '1.5', '4,000', '4294967296' ]) {
      expect(() => parseLookupKeys(registry, [ block ], [ value ])).toThrow();
    }
  });
  it('preserves integer precision and rejects unsafe JSON numbers', () => {
    const key = describeKey('u128', 'Test', 'Amount', 0);
    expect(parseLookupKeys(registry, [ key ], [ '340282366920938463463374607431768211455' ])[0]).toBe('340282366920938463463374607431768211455');
    expect(() => parseLookupKeys(registry, [ key ], [], '[9007199254740993]')).toThrow('quotes');
  });
  it('validates JSON shape and exact map argument count', () => {
    expect(() => parseLookupKeys(registry, [ block ], [], '{}')).toThrow('JSON array');
    expect(() => parseLookupKeys(registry, [ block ], [], '[]')).toThrow('needs 1');
    expect(() => parseLookupKeys(registry, [ block ], [], '[1,2]')).toThrow('needs 1');
    expect(parseLookupKeys(registry, [], [])).toEqual([]);
  });
  it('validates tuple keys as a single argument and separate map keys independently', () => {
    const tuple = describeKey('(u32,u32)', 'Test', 'Tuple', 0);
    expect(parseLookupKeys(registry, [ tuple ], [ '[1,2]' ])).toEqual([ [ 1, 2 ] ]);
    expect(parseLookupKeys(registry, [ block, block ], [ '1', '2' ])).toEqual([ '1', '2' ]);
  });
  it('checks account encoding before sending a request', () => {
    const key = describeKey('H160', 'System', 'Account', 0);
    expect(() => parseLookupKeys(registry, [ key ], [ 'bad-address' ])).toThrow('Account address');
    expect(parseLookupKeys(registry, [ key ], [ `0x${ '12'.repeat(20) }` ])).toHaveLength(1);
  });
});
