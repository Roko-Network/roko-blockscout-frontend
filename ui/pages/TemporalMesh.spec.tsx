// @vitest-environment jsdom

/**
 * Unit tests for the TemporalMesh page component.
 *
 * Written BEFORE implementation (TDD red phase).
 * These tests define the required rendering behaviour and drive the
 * component's public API.
 */

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as temporalMeshRpc from 'lib/api/services/general/temporalMeshRpc';
import {
  TEMPORAL_MESH_STATE,
  TEMPORAL_MESH_STATE_PARTIAL,
} from 'stubs/temporalMesh';

import TemporalMesh from './TemporalMesh';

vi.mock('lib/api/services/general/temporalMeshRpc', () => ({
  fetchTemporalMeshState: vi.fn(),
  formatOffsetNs: (ns: number) => {
    const sign = ns >= 0 ? '+' : '-';
    const abs = Math.abs(ns);
    if (abs >= 1_000_000) return `${ sign }${ (abs / 1_000_000).toFixed(3) } ms`;
    if (abs >= 1_000) return `${ sign }${ (abs / 1_000).toFixed(1) } µs`;
    return `${ sign }${ abs } ns`;
  },
  convergenceColor: (state: string) => {
    if (state === 'Converged') return 'green.400';
    if (state === 'Converging') return 'yellow.400';
    return 'red.400';
  },
  reputationColor: (bp: number) => {
    const pct = (bp / 10000) * 100;
    if (pct > 80) return 'green.400';
    if (pct > 50) return 'yellow.400';
    return 'red.400';
  },
  reputationToPercent: (bp: number) => Math.round((bp / 10000) * 100 * 10) / 10,
}));

// PageTitle uses useIsMobile → useBreakpointValue → window.matchMedia.
// Provide a stub so jsdom does not throw.
vi.mock('ui/shared/Page/PageTitle', () => ({
  default: ({ title, secondRow }: { title: string; secondRow?: React.ReactNode }) => (
    <div>
      <h1>{ title }</h1>
      { secondRow }
    </div>
  ),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/temporal/mesh', query: {}, asPath: '/temporal/mesh' }),
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

describe('TemporalMesh page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(temporalMeshRpc.fetchTemporalMeshState).mockResolvedValue(TEMPORAL_MESH_STATE);
  });

  // -------------------------------------------------------------------------
  // Structure / headings
  // -------------------------------------------------------------------------

  it('renders the "Mesh Dashboard" page title', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Mesh Dashboard').length).toBeGreaterThan(0);
  });

  it('renders the "Mesh Overview" section heading', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Mesh Overview').length).toBeGreaterThan(0);
  });

  it('renders the "Validators" section heading', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Validators').length).toBeGreaterThan(0);
  });

  it('renders the "Pairwise Offsets" section heading', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Pairwise Offsets').length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Overview card labels
  // -------------------------------------------------------------------------

  it('renders "Convergence" label', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Convergence').length).toBeGreaterThan(0);
  });

  it('renders "Mesh Quality" label', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Mesh Quality').length).toBeGreaterThan(0);
  });

  it('renders "Mesh Diameter" label', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Mesh Diameter').length).toBeGreaterThan(0);
  });

  it('renders "Peer Count" label', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Peer Count').length).toBeGreaterThan(0);
  });

  it('renders "Total Samples" label', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Total Samples').length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Data rendering after load
  // -------------------------------------------------------------------------

  it('shows "Converged" convergence state after data loads', async() => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.queryAllByText('Converged').length).toBeGreaterThan(0);
    });
  });

  it('shows quality percentage after data loads', async() => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      // TEMPORAL_MESH_STATE.quality_percent is 98.5
      expect(screen.queryAllByText('98.5%').length).toBeGreaterThan(0);
    });
  });

  it('shows peer count after data loads', async() => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      // TEMPORAL_MESH_STATE.peer_count is 3
      expect(screen.queryAllByText('3').length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Validator table
  // -------------------------------------------------------------------------

  it('renders validator table column headers', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Validator').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Clock Offset').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Reputation').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Tier').length).toBeGreaterThan(0);
  });

  it('renders one row per validator after data loads', async() => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      // Three validators in TEMPORAL_MESH_STATE — each has "#N" text
      expect(screen.queryAllByText('#0').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('#1').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('#2').length).toBeGreaterThan(0);
    });
  });

  it('renders tier values for all validators after data loads', async() => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.queryAllByText('Anchor').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Standard').length).toBeGreaterThan(0);
      expect(screen.queryAllByText('Minimal').length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Pairwise offsets table
  // -------------------------------------------------------------------------

  it('renders pairwise offset table column headers', () => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('From').length).toBeGreaterThan(0);
    expect(screen.getAllByText('To').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Offset').length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Graceful degradation
  // -------------------------------------------------------------------------

  it('shows "—" for mesh_diameter_ns when null', async() => {
    vi.mocked(temporalMeshRpc.fetchTemporalMeshState).mockResolvedValue(
      TEMPORAL_MESH_STATE_PARTIAL,
    );
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.queryAllByText('—').length).toBeGreaterThan(0);
    });
  });

  it('does not crash when validator list is empty', async() => {
    vi.mocked(temporalMeshRpc.fetchTemporalMeshState).mockResolvedValue({
      ...TEMPORAL_MESH_STATE,
      validators: [],
      pairwise_offsets: [],
    });
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText('Mesh Dashboard').length).toBeGreaterThan(0);
    });
  });

  it('calls fetchTemporalMeshState exactly once on mount', async() => {
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(temporalMeshRpc.fetchTemporalMeshState).toHaveBeenCalledTimes(1);
    });
  });

  it('does not crash when fetch fails', async() => {
    vi.mocked(temporalMeshRpc.fetchTemporalMeshState).mockRejectedValue(
      new Error('mesh RPC unavailable'),
    );
    render(<TemporalMesh/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.getAllByText('Mesh Dashboard').length).toBeGreaterThan(0);
    });
  });
});
