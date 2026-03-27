// @vitest-environment jsdom

/**
 * Unit tests for the TemporalValidatorDetail page component.
 *
 * Written BEFORE implementation (TDD red phase).
 */

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import * as temporalMeshRpc from 'lib/api/services/general/temporalMeshRpc';
import {
  TEMPORAL_VALIDATOR_REPORT_0,
  TEMPORAL_VALIDATOR_REPORT_2,
} from 'stubs/temporalMesh';

import TemporalValidatorDetail from './TemporalValidatorDetail';

vi.mock('lib/api/services/general/temporalMeshRpc', () => ({
  fetchTemporalValidatorQuality: vi.fn(),
  formatOffsetNs: (ns: number) => {
    const sign = ns >= 0 ? '+' : '-';
    const abs = Math.abs(ns);
    if (abs >= 1_000_000) return `${ sign }${ (abs / 1_000_000).toFixed(3) } ms`;
    if (abs >= 1_000) return `${ sign }${ (abs / 1_000).toFixed(1) } µs`;
    return `${ sign }${ abs } ns`;
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
vi.mock('ui/shared/Page/PageTitle', () => ({
  default: ({ title, secondRow }: { title: string; secondRow?: React.ReactNode }) => (
    <div>
      <h1>{ title }</h1>
      { secondRow }
    </div>
  ),
}));

vi.mock('next/router', () => ({
  useRouter: () => ({
    pathname: '/temporal/validators/[index]',
    query: { index: '0' },
    asPath: '/temporal/validators/0',
  }),
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

describe('TemporalValidatorDetail page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(temporalMeshRpc.fetchTemporalValidatorQuality).mockResolvedValue(
      TEMPORAL_VALIDATOR_REPORT_0,
    );
  });

  // -------------------------------------------------------------------------
  // Page title / structure
  // -------------------------------------------------------------------------

  it('renders a heading containing "Validator"', () => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    const headings = screen.getAllByText(/Validator/i);
    expect(headings.length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Stat labels
  // -------------------------------------------------------------------------

  it('renders "Authority Index" label', () => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Authority Index').length).toBeGreaterThan(0);
  });

  it('renders "Clock Offset" label', () => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Clock Offset').length).toBeGreaterThan(0);
  });

  it('renders "Root Distance" label', () => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Root Distance').length).toBeGreaterThan(0);
  });

  it('renders "Reputation" label', () => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Reputation').length).toBeGreaterThan(0);
  });

  it('renders "Tier" label', () => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Tier').length).toBeGreaterThan(0);
  });

  it('renders "Samples" label', () => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Samples').length).toBeGreaterThan(0);
  });

  it('renders "Violations" label', () => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Violations').length).toBeGreaterThan(0);
  });

  it('renders "Last Checkpoint" label', () => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    expect(screen.getAllByText('Last Checkpoint').length).toBeGreaterThan(0);
  });

  // -------------------------------------------------------------------------
  // Data rendering
  // -------------------------------------------------------------------------

  it('displays authority_index after data loads', async() => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      // authority_index is 0 — displayed as plain "0"
      expect(screen.queryAllByText('0').length).toBeGreaterThan(0);
    });
  });

  it('displays tier value after data loads', async() => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(screen.queryAllByText('Anchor').length).toBeGreaterThan(0);
    });
  });

  it('displays reputation percentage after data loads', async() => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    // TEMPORAL_VALIDATOR_REPORT_0.reputation = 9500 → 95%
    await waitFor(() => {
      expect(screen.queryAllByText('95%').length).toBeGreaterThan(0);
    });
  });

  it('displays violation count after data loads', async() => {
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    // TEMPORAL_VALIDATOR_REPORT_0.violation_count = 0
    await waitFor(() => {
      expect(screen.queryAllByText('0').length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Low-reputation validator rendering
  // -------------------------------------------------------------------------

  it('displays reputation percentage for low-reputation validator', async() => {
    vi.mocked(temporalMeshRpc.fetchTemporalValidatorQuality).mockResolvedValue(
      TEMPORAL_VALIDATOR_REPORT_2,
    );
    render(<TemporalValidatorDetail index={ 2 }/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      // reputation = 4500 → 45%
      expect(screen.queryAllByText('45%').length).toBeGreaterThan(0);
    });
  });

  // -------------------------------------------------------------------------
  // Graceful degradation
  // -------------------------------------------------------------------------

  it('does not crash when fetch fails', async() => {
    vi.mocked(temporalMeshRpc.fetchTemporalValidatorQuality).mockRejectedValue(
      new Error('validator RPC unavailable'),
    );
    render(<TemporalValidatorDetail index={ 0 }/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      const headings = screen.getAllByText(/Validator/i);
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  it('calls fetchTemporalValidatorQuality with the correct index', async() => {
    render(<TemporalValidatorDetail index={ 1 }/>, { wrapper: makeWrapper() });
    await waitFor(() => {
      expect(temporalMeshRpc.fetchTemporalValidatorQuality).toHaveBeenCalledWith(1);
    });
  });
});
