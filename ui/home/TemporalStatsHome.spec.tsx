// @vitest-environment jsdom

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as temporalRpc from 'lib/api/services/general/temporalRpc';
import { TEMPORAL_WATERMARK, TEMPORAL_CONSENSUS_TIME, TEMPORAL_QUEUE_STATS } from 'stubs/temporal';

import TemporalStatsHome from './TemporalStatsHome';

vi.mock('lib/api/services/general/temporalRpc', () => ({
  fetchTemporalWatermark: vi.fn(),
  fetchTemporalConsensusTime: vi.fn(),
  fetchTemporalQueueStats: vi.fn(),
}));

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

describe('TemporalStatsHome', () => {
  beforeEach(() => {
    // Clear all mock call history between tests so call counts are isolated.
    vi.clearAllMocks();
    vi.mocked(temporalRpc.fetchTemporalWatermark).mockResolvedValue(TEMPORAL_WATERMARK);
    vi.mocked(temporalRpc.fetchTemporalConsensusTime).mockResolvedValue(TEMPORAL_CONSENSUS_TIME);
    vi.mocked(temporalRpc.fetchTemporalQueueStats).mockResolvedValue(TEMPORAL_QUEUE_STATS);
  });

  it('renders the "Temporal Ordering" section heading', () => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    // Heading is a plain span (not in a Skeleton), rendered once per component.
    expect(screen.getAllByText('Temporal Ordering').length).toBeGreaterThan(0);
  });

  it('renders watermark label (at least one instance)', () => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    // Skeleton may duplicate children in loading state; use getAllByText.
    expect(screen.getAllByText('Watermark').length).toBeGreaterThan(0);
  });

  it('renders mesh quality label (at least one instance)', () => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Mesh Quality').length).toBeGreaterThan(0);
  });

  it('renders queue depth label (at least one instance)', () => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Queue Depth').length).toBeGreaterThan(0);
  });

  it('renders total stamped label (at least one instance)', () => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Total Stamped').length).toBeGreaterThan(0);
  });

  it('displays quality percentage after data loads', async() => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    // TEMPORAL_CONSENSUS_TIME has quality_percent: 98.5
    await waitFor(() => {
      expect(screen.queryAllByText('98.5%').length).toBeGreaterThan(0);
    });
  });

  it('displays queue depth as "pending" when non-zero after data loads', async() => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    // TEMPORAL_QUEUE_STATS has queue_depth: 42
    await waitFor(() => {
      expect(screen.queryAllByText('42 pending').length).toBeGreaterThan(0);
    });
  });

  it('displays "idle" when queue depth is 0', async() => {
    vi.mocked(temporalRpc.fetchTemporalQueueStats).mockResolvedValue({
      ...TEMPORAL_QUEUE_STATS,
      queue_depth: 0,
    });
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.queryAllByText('0 idle').length).toBeGreaterThan(0);
    });
  });

  it('displays total stamped with "txs stamped" suffix after data loads', async() => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    // TEMPORAL_QUEUE_STATS has total_stamped: 987654
    await waitFor(() => {
      expect(screen.queryAllByText('987,654 txs stamped').length).toBeGreaterThan(0);
    });
  });

  it('shows link to temporal dashboard', () => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    const links = screen.getAllByRole('link');
    const temporalLink = links.find((l) => l.getAttribute('href') === '/temporal');
    expect(temporalLink).toBeTruthy();
  });

  it('renders without crashing when watermark fetch fails', async() => {
    vi.mocked(temporalRpc.fetchTemporalWatermark).mockRejectedValue(new Error('RPC unreachable'));
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    // Even with a failed fetch, the section heading must remain visible.
    await waitFor(() => {
      expect(screen.getAllByText('Temporal Ordering').length).toBeGreaterThan(0);
    });
  });

  it('calls each of the three RPC fetchers exactly once on mount', async() => {
    render(<TemporalStatsHome/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(temporalRpc.fetchTemporalWatermark).toHaveBeenCalledTimes(1);
    });
    expect(temporalRpc.fetchTemporalConsensusTime).toHaveBeenCalledTimes(1);
    expect(temporalRpc.fetchTemporalQueueStats).toHaveBeenCalledTimes(1);
  });
});
