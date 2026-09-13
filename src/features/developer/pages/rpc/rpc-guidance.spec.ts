// SPDX-License-Identifier: LicenseRef-Blockscout
import { ApiPromise, HttpProvider } from '@polkadot/api';

import { describe, expect, it } from 'vitest';

import { parseRpcParams, TEMPORAL_GUIDES } from './rpc-guidance';

class OfflineProvider extends HttpProvider {
  get isConnected() {
    return false;
  }
}
const registry = new ApiPromise({ provider: new OfflineProvider('http://127.0.0.1:1') }).registry;
const guide = TEMPORAL_GUIDES.temporal_getBlockMetadata;
describe('RPC parameter guidance', () => {
  it('requires block input and omits blank optional hashes', () => {
    expect(() => parseRpcParams(registry, guide, [])).toThrow('block_number');
    expect(parseRpcParams(registry, guide, [ '123', '' ])).toEqual([ 123 ]);
  });
  it('validates hashes and unsigned integer boundaries in both modes', () => {
    for (const value of [ '-1', '1.5', '4294967296', '9007199254740993' ]) {
      expect(() => parseRpcParams(registry, guide, [ value ])).toThrow();
      expect(() => parseRpcParams(registry, guide, [], `[${ value }]`)).toThrow();
    }
    expect(() => parseRpcParams(registry, guide, [ '1', '0x123' ])).toThrow('32-byte');
    expect(parseRpcParams(registry, guide, [ '1', `0x${ 'ab'.repeat(32) }` ])).toHaveLength(2);
  });
  it('rejects extra parameters and non-array JSON', () => {
    expect(() => parseRpcParams(registry, guide, [], '{}')).toThrow('JSON array');
    expect(() => parseRpcParams(registry, guide, [], '[1,null,3]')).toThrow('at most');
    expect(() => parseRpcParams(registry, guide, [], '[]')).toThrow('block_number');
  });
  it('supports parameter-free methods and validates vectors', () => {
    expect(parseRpcParams(registry, TEMPORAL_GUIDES.temporal_getCheckpoint, [])).toEqual([]);
    expect(parseRpcParams(registry, TEMPORAL_GUIDES.temporal_getBlocksMetadata, [ '[1,2]' ])).toEqual([ [ 1, 2 ] ]);
    expect(() => parseRpcParams(registry, TEMPORAL_GUIDES.temporal_getBlocksMetadata, [ '[1,-2]' ])).toThrow();
  });
});
