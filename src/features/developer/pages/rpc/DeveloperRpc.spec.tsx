// SPDX-License-Identifier: LicenseRef-Blockscout
// @vitest-environment jsdom
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { ApiPromise, HttpProvider } from '@polkadot/api';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ send: vi.fn(), bundle: {} }));
vi.mock('src/features/substrate/hooks/usePolkadotApi', () => ({ usePolkadotApi: () => ({ data: fixture.bundle }) }));
vi.mock('src/features/developer/components/DeveloperSubNav', () => ({ 'default': () => null }));
vi.mock('src/shell/page/title/PageTitle', () => ({ 'default': () => <h1>RPC Calls</h1> }));

import DeveloperRpc from './DeveloperRpc';

class OfflineProvider extends HttpProvider {
  get isConnected() {
    return false;
  }
}
const registry = new ApiPromise({ provider: new OfflineProvider('http://127.0.0.1:1') }).registry;
const methods = [
  'system_health',
  'temporal_getBlockMetadata',
  'temporal_getCheckpoint',
  'chain_getFinalizedHead',
  'chain_getHeader',
  'temporal_getValidatorTimeQuality',
];
beforeEach(() => {
  fixture.send.mockReset();
  fixture.send.mockImplementation(async(method: string) => (method === 'rpc_methods' ? { methods } : null));
  fixture.bundle = {
    api: {
      registry,
      query: { session: { validators: async() => [ '0x1111111111111111111111111111111111111111' ] } },
      rpc: { system: { health: { meta: { description: 'Node health.', params: [], type: 'Health' } } } },
    },
    sendRpc: fixture.send,
    chain: 'Test chain',
  };
});
afterEach(cleanup);
const mount = () =>
  render(
    <ChakraProvider value={ defaultSystem }>
      <DeveloperRpc/>
    </ChakraProvider>,
  );

describe('RPC guided form', () => {
  it('does not submit missing inputs and fills finalized block numbers on demand', async() => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'temporal_getBlockMetadata' }));
    expect((screen.getByRole('button', { name: 'Call method' }) as HTMLButtonElement).disabled).toBe(true);
    const hash = `0x${ 'ab'.repeat(32) }`;
    fixture.send.mockImplementation(async(method: string) => {
      if (method === 'chain_getFinalizedHead') return hash;
      if (method === 'chain_getHeader') return { number: '0x64' };
      return null;
    });
    fireEvent.click(screen.getByRole('button', { name: 'Use finalized block number' }));
    await waitFor(() => expect((screen.getByLabelText(/block_number ·/) as HTMLInputElement).value).toBe('100'));
    fireEvent.click(screen.getByRole('button', { name: 'Call method' }));
    await screen.findByText(/call succeeded but returned no data/);
    expect(fixture.send).toHaveBeenCalledWith('temporal_getBlockMetadata', [ 100 ]);
  });
  it('fills an authority index from the current validator lookup', async() => {
    mount();
    fireEvent.click(await screen.findByRole('button', { name: 'temporal_getValidatorTimeQuality' }));
    fireEvent.click(screen.getByRole('button', { name: 'Find current validators' }));
    fireEvent.click(await screen.findByRole('button', { name: '0: 0x1111111111111111111111111111111111111111' }));
    expect((screen.getByLabelText(/authority_index ·/) as HTMLInputElement).value).toBe('0');
    fireEvent.click(screen.getByRole('button', { name: 'Call method' }));
    await waitFor(() => expect(fixture.send).toHaveBeenCalledWith('temporal_getValidatorTimeQuality', [ 0 ]));
  });
  it('treats arbitrary method names as undocumented without crashing', async() => {
    mount();
    await screen.findByRole('button', { name: 'temporal_getCheckpoint' });
    fireEvent.change(screen.getByLabelText('Method'), { target: { value: 'constructor' } });
    expect(screen.getByLabelText('Parameters (JSON array)')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Call method' }) as HTMLButtonElement).disabled).toBe(true);
  });
  it('preserves the original server error without retrying', async() => {
    mount();
    await screen.findByRole('button', { name: 'temporal_getCheckpoint' });
    fixture.send.mockRejectedValue(new Error('RPC denied by endpoint'));
    fireEvent.click(screen.getByRole('button', { name: 'Call method' }));
    await screen.findByText('RPC denied by endpoint');
    expect(fixture.send.mock.calls.filter(([ method ]) => method === 'system_health')).toHaveLength(1);
  });
  it('ignores a response after the method changes', async() => {
    mount();
    await screen.findByRole('button', { name: 'temporal_getCheckpoint' });
    let resolve!: (value: unknown) => void;
    fixture.send.mockImplementation(
      () =>
        new Promise((done) => {
          resolve = done;
        }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Call method' }));
    fireEvent.click(screen.getByRole('button', { name: 'temporal_getCheckpoint' }));
    await act(async() => {
      resolve({ stale: 'old response' });
    });
    await waitFor(() => expect(screen.queryByText(/old response/)).toBeNull());
    expect((screen.getByRole('button', { name: 'Call method' }) as HTMLButtonElement).disabled).toBe(false);
  });
});
