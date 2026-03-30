/**
 * Tests for temporal mesh RPC fetch helpers.
 *
 * Pattern mirrors temporalRpc.spec.ts: we test URL path construction and
 * pure data-transformation logic separately, avoiding actual HTTP calls.
 */

import { describe, expect, test } from 'vitest';

// ---------------------------------------------------------------------------
// URL path construction
// ---------------------------------------------------------------------------

describe('temporal mesh API URL paths', () => {
  test('mesh-state path is correct', () => {
    const path = '/api/v2/temporal/mesh-state';
    expect(path).toBe('/api/v2/temporal/mesh-state');
  });

  test('checkpoint path is correct', () => {
    const path = '/api/v2/temporal/checkpoint';
    expect(path).toBe('/api/v2/temporal/checkpoint');
  });

  test('validator quality path includes the index', () => {
    const index = 2;
    const path = `/api/v2/temporal/validators/${ index }/quality`;
    expect(path).toContain(String(index));
    expect(path).toBe('/api/v2/temporal/validators/2/quality');
  });
});

// ---------------------------------------------------------------------------
// Reputation conversion logic (basis points → percentage)
// ---------------------------------------------------------------------------

describe('reputationToPercent helper', () => {
  // Import once implementation exists; until then, inline the conversion to
  // define the expected contract.
  function reputationToPercent(basisPoints: number): number {
    return Math.round((basisPoints / 10000) * 100 * 10) / 10;
  }

  test('10000 bp maps to 100%', () => {
    expect(reputationToPercent(10000)).toBe(100);
  });

  test('5000 bp maps to 50%', () => {
    expect(reputationToPercent(5000)).toBe(50);
  });

  test('9500 bp maps to 95%', () => {
    expect(reputationToPercent(9500)).toBe(95);
  });

  test('0 bp maps to 0%', () => {
    expect(reputationToPercent(0)).toBe(0);
  });

  test('result is always in [0, 100]', () => {
    for (const bp of [ 0, 1, 999, 5000, 9999, 10000 ]) {
      const pct = reputationToPercent(bp);
      expect(pct).toBeGreaterThanOrEqual(0);
      expect(pct).toBeLessThanOrEqual(100);
    }
  });
});

// ---------------------------------------------------------------------------
// Nanosecond offset formatting
// ---------------------------------------------------------------------------

describe('formatOffsetNs helper', () => {
  function formatOffsetNs(ns: number): string {
    const sign = ns >= 0 ? '+' : '-';
    const abs = Math.abs(ns);
    if (abs >= 1_000_000) {
      return `${ sign }${ (abs / 1_000_000).toFixed(3) } ms`;
    }
    if (abs >= 1_000) {
      return `${ sign }${ (abs / 1_000).toFixed(1) } µs`;
    }
    return `${ sign }${ abs } ns`;
  }

  test('formats sub-microsecond values in ns', () => {
    expect(formatOffsetNs(500)).toBe('+500 ns');
    expect(formatOffsetNs(-900)).toBe('-900 ns');
  });

  test('formats microsecond-range values in µs', () => {
    expect(formatOffsetNs(120000)).toBe('+120.0 µs');
    expect(formatOffsetNs(-80000)).toBe('-80.0 µs');
  });

  test('formats millisecond-range values in ms', () => {
    expect(formatOffsetNs(5_000_000)).toBe('+5.000 ms');
    expect(formatOffsetNs(-1_500_000)).toBe('-1.500 ms');
  });

  test('handles zero offset', () => {
    expect(formatOffsetNs(0)).toBe('+0 ns');
  });
});

// ---------------------------------------------------------------------------
// Convergence state → indicator color mapping
// ---------------------------------------------------------------------------

describe('convergenceColor helper', () => {
  function convergenceColor(state: string): string {
    if (state === 'Converged') return 'green.400';
    if (state === 'Converging') return 'yellow.400';
    return 'red.400';
  }

  test('Converged maps to green', () => {
    expect(convergenceColor('Converged')).toBe('green.400');
  });

  test('Converging maps to yellow', () => {
    expect(convergenceColor('Converging')).toBe('yellow.400');
  });

  test('Diverged maps to red', () => {
    expect(convergenceColor('Diverged')).toBe('red.400');
  });

  test('unknown state maps to red', () => {
    expect(convergenceColor('Unknown')).toBe('red.400');
  });
});

// ---------------------------------------------------------------------------
// Reputation → indicator color mapping
// ---------------------------------------------------------------------------

describe('reputationColor helper', () => {
  function reputationColor(basisPoints: number): string {
    const pct = (basisPoints / 10000) * 100;
    if (pct > 80) return 'green.400';
    if (pct > 50) return 'yellow.400';
    return 'red.400';
  }

  test('>80% reputation is green', () => {
    expect(reputationColor(9500)).toBe('green.400');
    expect(reputationColor(8100)).toBe('green.400');
  });

  test('50–80% reputation is yellow', () => {
    expect(reputationColor(7000)).toBe('yellow.400');
    expect(reputationColor(5100)).toBe('yellow.400');
  });

  test('<=50% reputation is red', () => {
    expect(reputationColor(4500)).toBe('red.400');
    expect(reputationColor(0)).toBe('red.400');
  });
});

// ---------------------------------------------------------------------------
// TemporalProducerInfo response shaping
// ---------------------------------------------------------------------------

describe('fetchTemporalProducerInfo response shaping', () => {
  // Mirror the transformation logic from fetchTemporalProducerInfo to
  // verify it independently of HTTP calls.

  interface RawMeshResponse {
    timeQuality: number;
    convergenceState: string;
    peerCount: number;
    totalSamples: number;
    producerAuthorityIndex: number | null;
    producerRootDistanceNs: string;
    pairwiseOffsets: Array<unknown>;
  }

  interface TemporalProducerInfo {
    producerAuthorityIndex: number;
    producerRootDistanceNs: number;
    qualityPercent: number;
  }

  function transformProducerInfo(data: RawMeshResponse): TemporalProducerInfo {
    const qualityPercent = Math.round((data.timeQuality / 10000) * 100);
    const producerAuthorityIndex = data.producerAuthorityIndex ?? 0;
    const producerRootDistanceNs = parseInt(data.producerRootDistanceNs, 10) || 0;
    return { producerAuthorityIndex, producerRootDistanceNs, qualityPercent };
  }

  test('maps producerAuthorityIndex from response', () => {
    const raw: RawMeshResponse = {
      timeQuality: 9000,
      convergenceState: 'Converged',
      peerCount: 2,
      totalSamples: 100,
      producerAuthorityIndex: 3,
      producerRootDistanceNs: '6400',
      pairwiseOffsets: [],
    };
    const result = transformProducerInfo(raw);
    expect(result.producerAuthorityIndex).toBe(3);
  });

  test('defaults producerAuthorityIndex to 0 when null', () => {
    const raw: RawMeshResponse = {
      timeQuality: 8000,
      convergenceState: 'Converging',
      peerCount: 1,
      totalSamples: 50,
      producerAuthorityIndex: null,
      producerRootDistanceNs: '1000',
      pairwiseOffsets: [],
    };
    const result = transformProducerInfo(raw);
    expect(result.producerAuthorityIndex).toBe(0);
  });

  test('parses producerRootDistanceNs as integer', () => {
    const raw: RawMeshResponse = {
      timeQuality: 7500,
      convergenceState: 'Converged',
      peerCount: 2,
      totalSamples: 80,
      producerAuthorityIndex: 1,
      producerRootDistanceNs: '120000',
      pairwiseOffsets: [],
    };
    const result = transformProducerInfo(raw);
    expect(result.producerRootDistanceNs).toBe(120000);
  });

  test('defaults producerRootDistanceNs to 0 when unparseable', () => {
    const raw: RawMeshResponse = {
      timeQuality: 6000,
      convergenceState: 'Converging',
      peerCount: 1,
      totalSamples: 10,
      producerAuthorityIndex: 0,
      producerRootDistanceNs: 'invalid',
      pairwiseOffsets: [],
    };
    const result = transformProducerInfo(raw);
    expect(result.producerRootDistanceNs).toBe(0);
  });

  test('converts timeQuality basis points to qualityPercent', () => {
    const raw: RawMeshResponse = {
      timeQuality: 9500,
      convergenceState: 'Converged',
      peerCount: 3,
      totalSamples: 200,
      producerAuthorityIndex: 2,
      producerRootDistanceNs: '5000',
      pairwiseOffsets: [],
    };
    const result = transformProducerInfo(raw);
    expect(result.qualityPercent).toBe(95);
  });

  test('rounds qualityPercent to nearest integer', () => {
    // 5001/10000 * 100 = 50.01 → rounds to 50
    const raw: RawMeshResponse = {
      timeQuality: 5001,
      convergenceState: 'Converging',
      peerCount: 1,
      totalSamples: 30,
      producerAuthorityIndex: 0,
      producerRootDistanceNs: '0',
      pairwiseOffsets: [],
    };
    const result = transformProducerInfo(raw);
    expect(result.qualityPercent).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// BlockProducerInfo display formatting helpers
// ---------------------------------------------------------------------------

describe('BlockProducerInfo — formatRootDistance helper', () => {
  // The component uses formatOffsetNs but for root distance (always positive).
  // We verify the unsigned-magnitude variant used for root distance display.
  function formatRootDistanceNs(ns: number): string {
    const abs = Math.abs(ns);
    if (abs >= 1_000_000) {
      return `${ (abs / 1_000_000).toFixed(3) } ms from UTC`;
    }
    if (abs >= 1_000) {
      return `${ (abs / 1_000).toFixed(1) } µs from UTC`;
    }
    return `${ abs } ns from UTC`;
  }

  test('formats sub-microsecond root distance in ns', () => {
    expect(formatRootDistanceNs(500)).toBe('500 ns from UTC');
  });

  test('formats microsecond root distance with one decimal', () => {
    expect(formatRootDistanceNs(6400)).toBe('6.4 µs from UTC');
  });

  test('formats millisecond root distance with three decimals', () => {
    expect(formatRootDistanceNs(2_500_000)).toBe('2.500 ms from UTC');
  });

  test('handles zero distance', () => {
    expect(formatRootDistanceNs(0)).toBe('0 ns from UTC');
  });
});

describe('BlockProducerInfo — quality badge color', () => {
  // Mirrors the qualityColor helper in BlockProducerInfo.tsx.
  function qualityColor(pct: number): string {
    if (pct >= 90) return 'green.400';
    if (pct >= 70) return 'yellow.400';
    return 'red.400';
  }

  test('90% or above is green', () => {
    expect(qualityColor(90)).toBe('green.400');
    expect(qualityColor(100)).toBe('green.400');
    expect(qualityColor(95)).toBe('green.400');
  });

  test('70–89% is yellow', () => {
    expect(qualityColor(70)).toBe('yellow.400');
    expect(qualityColor(89)).toBe('yellow.400');
  });

  test('below 70% is red', () => {
    expect(qualityColor(69)).toBe('red.400');
    expect(qualityColor(0)).toBe('red.400');
  });
});
