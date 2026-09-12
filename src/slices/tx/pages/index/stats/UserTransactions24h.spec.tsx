// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';

import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('src/shared/stats/StatsWidget', () => ({
  'default': ({ value, isLoading }: { value: string; isLoading: boolean }) => <div>{ isLoading ? 'Loading' : value }</div>,
}));

import UserTransactions24h, { SUMMARY_URL, validSummary } from './UserTransactions24h';

const summary = (total = 343) => ({
  schemaVersion: 1, chainId: 52370, complete: true, windowSeconds: 86400,
  expiresAt: new Date(Date.now() + 300_000).toISOString(), counts: { evm: total, nativeSigned: 0, total },
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('daily public index count', () => {
  it.each([ 343, 0 ])('renders index count %s, including zero', async(total) => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async() => summary(total) });
    vi.stubGlobal('fetch', fetchMock);
    const client = new QueryClient();
    render(<QueryClientProvider client={ client }><UserTransactions24h/></QueryClientProvider>);
    await waitFor(() => expect(screen.getByText(String(total))).toBeTruthy());
    expect(fetchMock).toHaveBeenCalledWith(SUMMARY_URL);
    client.clear();
  });

  it('rejects expired, incomplete, wrong-chain and inconsistent counts', () => {
    expect(validSummary({ ...summary(), expiresAt: '2020-01-01T00:00:00Z' })).toBe(false);
    expect(validSummary({ ...summary(), complete: false })).toBe(false);
    expect(validSummary({ ...summary(), chainId: 1 })).toBe(false);
    expect(validSummary({ ...summary(), counts: { evm: 343, nativeSigned: 2, total: 343 } })).toBe(false);
  });

  it('shows unavailable when the index fails instead of a cached EVM count', async() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false }));
    const client = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });
    render(<QueryClientProvider client={ client }><UserTransactions24h/></QueryClientProvider>);
    await waitFor(() => expect(screen.getByText('Unavailable')).toBeTruthy());
    client.clear();
  });
});
