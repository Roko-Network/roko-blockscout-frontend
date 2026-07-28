// @vitest-environment jsdom

/**
 * Unit tests for TxTemporalTimestamp.
 *
 * Written BEFORE implementation (TDD red phase).
 * These tests define the quality indicator line that should appear beneath the
 * existing timestamp display once consensus data is available.
 */

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within, waitFor } from '@testing-library/react';
import React from 'react';

import * as temporalRpc from 'src/features/temporal/api/temporal-rpc';

import { describe, it, expect, vi, beforeEach } from 'vitest';

import TxTemporalTimestamp from './TxTemporalTimestamp';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock('src/features/temporal/api/temporal-rpc', () => ({
  fetchTemporalTxTimestamp: vi.fn(),
  fetchTemporalConsensusTime: vi.fn(),
}));

// The DetailedInfo wrappers and Skeleton are presentation-only; render them
// transparently so we can query text content directly.
vi.mock('src/shared/detailed-info/DetailedInfo', () => ({
  // Component export names intentionally mirror the mocked module.
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ItemLabel: ({ children }: { children: React.ReactNode }) => <dt>{ children }</dt>,
  // eslint-disable-next-line @typescript-eslint/naming-convention
  ItemValue: ({ children }: { children: React.ReactNode }) => <dd>{ children }</dd>,
}));

vi.mock('src/toolkit/chakra/skeleton', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  Skeleton: ({ children }: { children: React.ReactNode }) => <span>{ children }</span>,
}));

vi.mock('src/features/temporal/utils/formatNanoTimestamp', () => ({
  formatNanoTimestamp: (ns: string) => `formatted:${ ns }`,
  nanoToDatetime: (ns: string) => new Date(Number(ns) / 1_000_000).toISOString(),
}));

// ---------------------------------------------------------------------------
// Fixture data
// ---------------------------------------------------------------------------

const TX_TIMESTAMP_DATA = {
  timestamp_ns: '1700000000000000000',
  timestamp_datetime: '2023-11-14T22:13:20.000Z',
  wait_ns: '500000000',
};

const CONSENSUS_DATA = {
  consensus_time_ns: '1700000001000000000',
  consensus_time_datetime: '2023-11-14T22:13:21.000Z',
  quality_percent: 87,
  is_converged: true,
  mesh_node_count: 3,
};

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: 0 } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider value={ defaultSystem }>
      <QueryClientProvider client={ queryClient }>
        { children }
      </QueryClientProvider>
    </ChakraProvider>
  );
  Wrapper.displayName = 'TestWrapper';
  return Wrapper;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TxTemporalTimestamp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(temporalRpc.fetchTemporalTxTimestamp).mockResolvedValue(TX_TIMESTAMP_DATA);
    vi.mocked(temporalRpc.fetchTemporalConsensusTime).mockResolvedValue(CONSENSUS_DATA);
  });

  // -------------------------------------------------------------------------
  // Existing behavior — must not regress
  // -------------------------------------------------------------------------

  it('renders the "Timestamping time" label', async() => {
    render(<TxTemporalTimestamp txHash="0xabc"/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.queryAllByText('Timestamping time').length).toBeGreaterThan(0);
    });
  });

  it('renders the formatted nanosecond timestamp after data loads', async() => {
    render(<TxTemporalTimestamp txHash="0xabc"/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(
        screen.queryAllByText(`formatted:${ TX_TIMESTAMP_DATA.timestamp_ns }`).length,
      ).toBeGreaterThan(0);
    });
  });

  it('renders the wait time indicator when wait_ns is present', async() => {
    render(<TxTemporalTimestamp txHash="0xabc"/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      // 500000000 ns = 500 ms
      expect(screen.queryAllByText(/waited 500\.0 ms/).length).toBeGreaterThan(0);
    });
  });

  it('returns null when the timestamp fetch fails', async() => {
    vi.mocked(temporalRpc.fetchTemporalTxTimestamp).mockRejectedValue(new Error('not found'));
    const { container } = render(<TxTemporalTimestamp txHash="0xabc"/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  it('returns null when timestamp_ns is empty', async() => {
    vi.mocked(temporalRpc.fetchTemporalTxTimestamp).mockResolvedValue({
      ...TX_TIMESTAMP_DATA,
      timestamp_ns: '',
    });
    const { container } = render(<TxTemporalTimestamp txHash="0xabc"/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // New behavior — mesh quality indicator
  // -------------------------------------------------------------------------

  it('renders the quality indicator line after data loads', async() => {
    render(<TxTemporalTimestamp txHash="0xabc"/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(
        screen.queryAllByText(/87% mesh quality/).length,
      ).toBeGreaterThan(0);
    });
  });

  it('calls fetchTemporalConsensusTime once on mount', async() => {
    render(<TxTemporalTimestamp txHash="0xabc"/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(temporalRpc.fetchTemporalConsensusTime).toHaveBeenCalledTimes(1);
    });
  });

  it('does not crash when consensus fetch fails', async() => {
    vi.mocked(temporalRpc.fetchTemporalConsensusTime).mockRejectedValue(new Error('rpc down'));
    const { container } = render(
      <TxTemporalTimestamp txHash="0xabc"/>,
      { wrapper: makeWrapper() },
    );
    await waitFor(() => {
      // The main timestamp row must still render even without consensus data.
      expect(within(container).queryAllByText('Timestamping time').length).toBeGreaterThan(0);
    });
    // Quality line must NOT be present within this render's container.
    expect(within(container).queryAllByText(/mesh quality/).length).toBe(0);
  });

  it('omits quality indicator when quality_percent is zero', async() => {
    vi.mocked(temporalRpc.fetchTemporalConsensusTime).mockResolvedValue({
      ...CONSENSUS_DATA,
      quality_percent: 0,
    });
    const { container } = render(
      <TxTemporalTimestamp txHash="0xabc"/>,
      { wrapper: makeWrapper() },
    );
    await waitFor(() => {
      // Still shows the main row.
      expect(within(container).queryAllByText('Timestamping time').length).toBeGreaterThan(0);
    });
    // No quality line for 0%.
    expect(within(container).queryAllByText(/mesh quality/).length).toBe(0);
  });
});
