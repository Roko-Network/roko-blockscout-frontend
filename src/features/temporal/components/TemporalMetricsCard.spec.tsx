// @vitest-environment jsdom

/**
 * Unit tests for TemporalMetricsCard component.
 *
 * Written BEFORE implementation (TDD red phase).
 * These tests define the required rendering behaviour and drive the
 * component's public API.
 */

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect } from 'vitest';

import { TEMPORAL_METRICS, TEMPORAL_METRICS_WITH_FAILURES } from 'src/features/temporal/stubs';

// Import after stubs are loaded.
import TemporalMetricsCard from './TemporalMetricsCard';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={ defaultSystem }>
      { children }
    </ChakraProvider>
  );
}

function renderCard(props: { data: typeof TEMPORAL_METRICS | undefined; isLoading: boolean }) {
  return render(<TemporalMetricsCard { ...props }/>, { wrapper });
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('TemporalMetricsCard – loading state', () => {
  it('renders a container element while loading', () => {
    const { container } = renderCard({ data: undefined, isLoading: true });
    expect(container.firstChild).toBeTruthy();
  });

  it('does not crash when data is undefined and isLoading is true', () => {
    expect(() => renderCard({ data: undefined, isLoading: true })).not.toThrow();
  });

  it('does not crash when data is undefined and isLoading is false', () => {
    expect(() => renderCard({ data: undefined, isLoading: false })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// Card title
// ---------------------------------------------------------------------------

describe('TemporalMetricsCard – title', () => {
  it('renders the section title', () => {
    renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    // Chakra Skeleton may duplicate content — use getAllByText and assert at least one.
    expect(screen.getAllByText(/Network Temporal Health/i).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Metric rows
// ---------------------------------------------------------------------------

describe('TemporalMetricsCard – metric rows', () => {
  it('renders total temporal transactions label', () => {
    renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    expect(screen.getAllByText(/temporal transactions/i).length).toBeGreaterThan(0);
  });

  it('renders validation failures label', () => {
    renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    expect(screen.getAllByText(/validation failures/i).length).toBeGreaterThan(0);
  });

  it('renders ordering violations label', () => {
    renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    expect(screen.getAllByText(/ordering violations/i).length).toBeGreaterThan(0);
  });

  it('renders active temporal keys label', () => {
    renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    expect(screen.getAllByText(/active temporal keys/i).length).toBeGreaterThan(0);
  });

  it('renders expired transactions cleaned label', () => {
    renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    expect(screen.getAllByText(/expired.*cleaned/i).length).toBeGreaterThan(0);
  });

  it('displays the total_temporal_transactions value', () => {
    renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    // 12345 formatted with toLocaleString may vary by locale; check for numeric content.
    expect(screen.getAllByText(/12[,.]?345/).length).toBeGreaterThan(0);
  });

  it('displays the active_temporal_keys value', () => {
    renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    // Value '3' appears as active_temporal_keys.
    expect(screen.getAllByText('3').length).toBeGreaterThan(0);
  });

  it('displays expired_transactions_cleaned value', () => {
    renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Health indicators — zero-failure state shows checkmark
// ---------------------------------------------------------------------------

describe('TemporalMetricsCard – health indicators (healthy chain)', () => {
  it('shows a green indicator when validation failures is 0', () => {
    const { container } = renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    // A green dot or checkmark element should be present.
    const indicators = container.querySelectorAll('[data-testid="healthy-indicator"]');
    expect(indicators.length).toBeGreaterThan(0);
  });

  it('shows green indicator for ordering violations when value is 0', () => {
    const { container } = renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    const indicators = container.querySelectorAll('[data-testid="healthy-indicator"]');
    // Both validation failures and ordering violations should show healthy.
    expect(indicators.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Health indicators — non-zero state shows warning
// ---------------------------------------------------------------------------

describe('TemporalMetricsCard – health indicators (degraded chain)', () => {
  it('shows a warning indicator when validation failures > 0', () => {
    const { container } = renderCard({ data: TEMPORAL_METRICS_WITH_FAILURES, isLoading: false });
    const warnings = container.querySelectorAll('[data-testid="warning-indicator"]');
    expect(warnings.length).toBeGreaterThan(0);
  });

  it('shows a warning indicator for ordering violations when value > 0', () => {
    const { container } = renderCard({ data: TEMPORAL_METRICS_WITH_FAILURES, isLoading: false });
    const warnings = container.querySelectorAll('[data-testid="warning-indicator"]');
    // Both failures and violations should appear as warnings.
    expect(warnings.length).toBeGreaterThanOrEqual(2);
  });
});

// ---------------------------------------------------------------------------
// Card styling
// ---------------------------------------------------------------------------

describe('TemporalMetricsCard – card styling', () => {
  it('renders a box container', () => {
    const { container } = renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    expect(container.firstChild).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// React.memo / stability
// ---------------------------------------------------------------------------

describe('TemporalMetricsCard – memoization', () => {
  it('renders identically on re-render with the same props', () => {
    const { container, rerender } = renderCard({ data: TEMPORAL_METRICS, isLoading: false });
    const htmlBefore = container.innerHTML;
    rerender(
      <ChakraProvider value={ defaultSystem }>
        <TemporalMetricsCard data={ TEMPORAL_METRICS } isLoading={ false }/>
      </ChakraProvider>,
    );
    expect(container.innerHTML).toBe(htmlBefore);
  });
});
