// @vitest-environment jsdom
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

const fixture = vi.hoisted(() => ({ fetch: vi.fn(), fullStats: vi.fn() }));
vi.mock('src/features/substrate/api/substrate-api', () => ({ fetchNativeTransactionCount: fixture.fetch, fetchSubstrateStats: fixture.fullStats }));
vi.mock('src/api/hooks/useApiQuery', () => ({ 'default': () => ({}) }));
vi.mock('src/slices/chain/stats/useStatsQuery', () => ({ 'default': () => ({
  data: {
    average_block_time: 4800, total_transactions: '100', total_addresses: '212', total_blocks: '1000',
    gas_prices: { average: { price: 0.4 }, slow: { price: 0.4 }, fast: { price: 0.4 } } },
}) }));
vi.mock('src/slices/home/contexts/home-data-context', () => ({ useHomeDataContext: () => ({ blocksQuery: { data: [ { height: 1000 } ] } }) }));
vi.mock('src/config', () => ({ 'default': {
  chain: { currency: { symbol: 'ROKO' } },
  features: { rollup: { isEnabled: false }, stats: { isEnabled: false }, gasTracker: { isEnabled: true } },
  slices: { home: { stats: [ 'total_blocks', 'average_block_time', 'total_txs', 'wallet_addresses', 'gas_tracker' ] } },
} }));
vi.mock('src/shared/stats/StatsWidget', () => ({
  'default': ({ label, value, isLoading }: { label: string; value: React.ReactNode; isLoading?: boolean }) => (
    <div data-testid={ label }>{ isLoading ? 'Loading' : value }</div>
  ),
}));
vi.mock('./LatestBlockStatsWidget', () => ({
  'default': ({ isLoading }: { isLoading?: boolean }) => <div data-testid="Latest block">{ isLoading ? 'Loading' : '1000' }</div> }));
vi.mock('./LatestBatchStatsWidget', () => ({ 'default': () => null }));
vi.mock('./StatsDegraded', () => ({ 'default': () => <div>Error</div> }));
vi.mock('src/slices/gas/components/GasInfoTooltip', () => ({ 'default': () => null }));
vi.mock('src/slices/gas/components/GasPrice', () => ({ 'default': () => <span>0.4 Gwei</span> }));
vi.mock('src/sprite/SpriteIcon', () => ({ 'default': () => null }));

import Stats from './Stats';

afterEach(cleanup);

describe('homepage summary loading', () => {
  it('renders independent cards while native totals are pending, then renders the combined total', async() => {
    let resolve!: (value: unknown) => void;
    fixture.fetch.mockImplementation(() => new Promise((done) => {
      resolve = done;
    }));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={ client }><ChakraProvider value={ defaultSystem }><Stats/></ChakraProvider></QueryClientProvider>);
    expect(screen.getByTestId('Latest block').textContent).toBe('1000');
    expect(screen.getByTestId('Average block time').textContent).toBe('4.8s');
    expect(screen.getByTestId('Wallet addresses').textContent).toBe('212');
    expect(screen.getByTestId('Gas tracker').textContent).toBe('0.4 Gwei');
    expect(screen.getByTestId('Total transactions').textContent).toBe('Loading');
    resolve({ total_native_signed_extrinsics: 31 });
    await waitFor(() => expect(screen.getByTestId('Total user transactions').textContent).toBe('131'));
    expect(fixture.fullStats).not.toHaveBeenCalled();
    client.clear();
  });
});
