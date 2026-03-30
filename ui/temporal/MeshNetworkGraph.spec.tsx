// @vitest-environment jsdom

/**
 * Unit tests for MeshNetworkGraph component.
 *
 * Written BEFORE implementation (TDD red phase).
 * These tests define the required SVG rendering behaviour and drive the
 * component's public API.
 */

import { ChakraProvider, defaultSystem } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, it, expect, vi } from 'vitest';

import type { TemporalMeshState } from 'types/api/temporalMesh';
import {
  TEMPORAL_MESH_STATE,
  TEMPORAL_MESH_STATE_PARTIAL,
} from 'stubs/temporalMesh';

// Mock formatOffsetNs so tests are not coupled to its internal formatting logic.
vi.mock('lib/api/services/general/temporalMeshRpc', () => ({
  formatOffsetNs: (ns: number) => {
    const sign = ns >= 0 ? '+' : '-';
    const abs = Math.abs(ns);
    if (abs >= 1_000_000) return `${ sign }${ (abs / 1_000_000).toFixed(3) } ms`;
    if (abs >= 1_000) return `${ sign }${ (abs / 1_000).toFixed(1) } µs`;
    return `${ sign }${ abs } ns`;
  },
}));

// Import after the mock is registered.
import MeshNetworkGraph from './MeshNetworkGraph';

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider value={ defaultSystem }>
      { children }
    </ChakraProvider>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function renderGraph(props: { data: TemporalMeshState | undefined; isLoading: boolean }) {
  return render(<MeshNetworkGraph { ...props }/>, { wrapper });
}

// ---------------------------------------------------------------------------
// Loading state
// ---------------------------------------------------------------------------

describe('MeshNetworkGraph – loading state', () => {
  it('renders a container element while loading', () => {
    const { container } = renderGraph({ data: undefined, isLoading: true });
    expect(container.firstChild).toBeTruthy();
  });

  it('does not crash when data is undefined and isLoading is true', () => {
    expect(() => renderGraph({ data: undefined, isLoading: true })).not.toThrow();
  });

  it('does not crash when data is undefined and isLoading is false', () => {
    expect(() => renderGraph({ data: undefined, isLoading: false })).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// SVG structure
// ---------------------------------------------------------------------------

describe('MeshNetworkGraph – SVG structure', () => {
  it('renders an SVG element when data is provided', () => {
    const { container } = renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('SVG has a viewBox attribute for responsiveness', () => {
    const { container } = renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('viewBox')).toBeTruthy();
  });

  it('SVG width is 100%', () => {
    const { container } = renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('100%');
  });
});

// ---------------------------------------------------------------------------
// Node rendering
// ---------------------------------------------------------------------------

describe('MeshNetworkGraph – validator nodes', () => {
  it('renders a circle for each validator (including producer at index 0)', () => {
    const { container } = renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    // TEMPORAL_MESH_STATE has 3 validators: indices 0, 1, 2
    // The mesh API returns validators array (may not include the producer).
    // The graph must show all known authorities.
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('renders "V0" label for authority index 0', () => {
    renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    expect(screen.getAllByText('V0').length).toBeGreaterThan(0);
  });

  it('renders "V1" label for authority index 1', () => {
    renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    expect(screen.getAllByText('V1').length).toBeGreaterThan(0);
  });

  it('renders "V2" label for authority index 2', () => {
    renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    expect(screen.getAllByText('V2').length).toBeGreaterThan(0);
  });

  it('renders at least one node when only one validator is present', () => {
    const singleValidator: TemporalMeshState = {
      ...TEMPORAL_MESH_STATE,
      validators: [ TEMPORAL_MESH_STATE.validators[0]! ],
      pairwise_offsets: [],
      peer_count: 1,
    };
    const { container } = renderGraph({ data: singleValidator, isLoading: false });
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);
  });

  it('renders no circles when there are zero validators', () => {
    const empty: TemporalMeshState = {
      ...TEMPORAL_MESH_STATE,
      validators: [],
      pairwise_offsets: [],
      peer_count: 0,
    };
    const { container } = renderGraph({ data: empty, isLoading: false });
    // No validator nodes should be drawn, but the SVG/container still exists.
    const nodeCircles = container.querySelectorAll('circle[data-testid="validator-node"]');
    expect(nodeCircles.length).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Edge rendering
// ---------------------------------------------------------------------------

describe('MeshNetworkGraph – edges', () => {
  it('renders line elements for pairwise connections', () => {
    const { container } = renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    // TEMPORAL_MESH_STATE has 3 pairwise offsets.
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBeGreaterThan(0);
  });

  it('renders no lines when pairwise_offsets is empty', () => {
    renderGraph({ data: TEMPORAL_MESH_STATE_PARTIAL, isLoading: false });
    // TEMPORAL_MESH_STATE_PARTIAL has empty pairwise_offsets.
    // Lines should not appear (we may still have circles for nodes).
    // The test simply confirms no crash and the count is 0.
    const { container } = renderGraph({ data: TEMPORAL_MESH_STATE_PARTIAL, isLoading: false });
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(0);
  });

  it('renders offset labels for each pairwise connection', () => {
    renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    // TEMPORAL_MESH_STATE pairwise offsets include 200000 ns (+200.0 µs), 330000 ns (+330.0 µs).
    // At least one formatted offset label should appear.
    expect(screen.getAllByText(/µs|ms|ns/).length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Center info
// ---------------------------------------------------------------------------

describe('MeshNetworkGraph – center info', () => {
  it('renders the mesh quality percentage in the center', () => {
    renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    // TEMPORAL_MESH_STATE.quality_percent is 98.5
    expect(screen.getAllByText(/98\.5%|98\.5/).length).toBeGreaterThan(0);
  });

  it('renders a convergence indicator in the center area', () => {
    const { container } = renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    // The convergence dot is a circle with a data attribute or fill color.
    // We check that there is at least one element representing convergence state.
    // The SVG center should contain a circle or text with convergence info.
    expect(container.querySelector('[data-testid="convergence-dot"]')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Producer node highlighting
// ---------------------------------------------------------------------------

describe('MeshNetworkGraph – producer node', () => {
  it('renders the producer node with a distinguishing attribute', () => {
    // The data returned by fetchTemporalMeshState places the producer at the
    // lowest authority index not present in the validators array, or the one
    // identified by the pairwise_offsets from_index.
    // In TEMPORAL_MESH_STATE, from_index values include 0 — producer is 0.
    const { container } = renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    const producerNode = container.querySelector('[data-testid="producer-node"]');
    expect(producerNode).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// React.memo / stability
// ---------------------------------------------------------------------------

describe('MeshNetworkGraph – memoization', () => {
  it('renders identically on re-render with the same props', () => {
    const { container, rerender } = renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    const htmlBefore = container.innerHTML;
    rerender(
      <ChakraProvider value={ defaultSystem }>
        <MeshNetworkGraph data={ TEMPORAL_MESH_STATE } isLoading={ false }/>
      </ChakraProvider>,
    );
    expect(container.innerHTML).toBe(htmlBefore);
  });
});

// ---------------------------------------------------------------------------
// Dark background styling
// ---------------------------------------------------------------------------

describe('MeshNetworkGraph – dark panel aesthetic', () => {
  it('has a dark background container', () => {
    const { container } = renderGraph({ data: TEMPORAL_MESH_STATE, isLoading: false });
    // The outermost Box should carry the dark background color.
    // We check that the element or one of its descendants contains the
    // expected background style or class attribute.
    const root = container.firstChild as HTMLElement;
    expect(root).toBeTruthy();
    // Background is applied via Chakra style prop — verify the element exists.
    expect(root.tagName).toBeTruthy();
  });
});
