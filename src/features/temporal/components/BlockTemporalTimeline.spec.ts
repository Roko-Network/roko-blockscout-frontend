/**
 * Unit tests for pure utility functions exported from BlockTemporalTimeline.tsx.
 *
 * React component rendering tests belong in Playwright (*.pw.tsx); the pure
 * logic functions are fast and easy to test in vitest without a browser.
 */

import { describe, expect, test } from 'vitest';

import { formatGapNs, gapColor, totalSpanLabel } from './BlockTemporalTimeline';

// ---------------------------------------------------------------------------
// formatGapNs
// ---------------------------------------------------------------------------

describe('formatGapNs', () => {
  test('formats zero as "0 ns"', () => {
    expect(formatGapNs(0)).toBe('0 ns');
  });

  test('formats sub-microsecond values as nanoseconds', () => {
    expect(formatGapNs(1)).toBe('1 ns');
    expect(formatGapNs(999)).toBe('999 ns');
  });

  test('formats 1000 ns as "1.0 µs"', () => {
    expect(formatGapNs(1_000)).toBe('1.0 \u00b5s');
  });

  test('formats sub-millisecond values as microseconds', () => {
    expect(formatGapNs(1_500)).toBe('1.5 \u00b5s');
    // 999_999 ns / 1000 = 999.999, displayed as 1000.0
    expect(formatGapNs(999_999)).toBe('1000.0 \u00b5s');
  });

  test('formats 1_000_000 ns as "1.0 ms"', () => {
    expect(formatGapNs(1_000_000)).toBe('1.0 ms');
  });

  test('formats sub-second values as milliseconds', () => {
    expect(formatGapNs(50_000_000)).toBe('50.0 ms');
  });

  test('formats 1_000_000_000 ns as "1.00 s"', () => {
    expect(formatGapNs(1_000_000_000)).toBe('1.00 s');
  });

  test('formats multi-second values', () => {
    expect(formatGapNs(2_500_000_000)).toBe('2.50 s');
  });
});

// ---------------------------------------------------------------------------
// gapColor
// ---------------------------------------------------------------------------

describe('gapColor', () => {
  test('returns "green" for 0 ns', () => {
    expect(gapColor(0)).toBe('green');
  });

  test('returns "green" for values strictly less than 1 ms', () => {
    expect(gapColor(999_999)).toBe('green');
  });

  test('returns "yellow" for exactly 1 ms', () => {
    expect(gapColor(1_000_000)).toBe('yellow');
  });

  test('returns "yellow" for values in [1 ms, 100 ms)', () => {
    expect(gapColor(50_000_000)).toBe('yellow');
    expect(gapColor(99_999_999)).toBe('yellow');
  });

  test('returns "red" for exactly 100 ms', () => {
    expect(gapColor(100_000_000)).toBe('red');
  });

  test('returns "red" for values >= 100 ms', () => {
    expect(gapColor(200_000_000)).toBe('red');
    expect(gapColor(1_000_000_000)).toBe('red');
  });
});

// ---------------------------------------------------------------------------
// totalSpanLabel
// ---------------------------------------------------------------------------

describe('totalSpanLabel', () => {
  test('returns null for empty input', () => {
    expect(totalSpanLabel([])).toBeNull();
  });

  test('returns null for a single stamped transaction', () => {
    expect(totalSpanLabel([ { timestampNs: '1000000000' } ])).toBeNull();
  });

  test('returns null when all timestamps are null', () => {
    expect(totalSpanLabel([ { timestampNs: null }, { timestampNs: null } ])).toBeNull();
  });

  test('returns null when only one timestamp is non-null', () => {
    expect(totalSpanLabel([ { timestampNs: null }, { timestampNs: '1000000000' } ])).toBeNull();
  });

  test('computes span between two stamped entries', () => {
    const entries = [
      { timestampNs: '1000000000' },
      { timestampNs: '1001000000' },
    ];
    // span = 1_000_000 ns = 1.0 ms
    expect(totalSpanLabel(entries)).toBe('1.0 ms');
  });

  test('computes span across three entries ignoring order', () => {
    const entries = [
      { timestampNs: '1002000000' },
      { timestampNs: '1000000000' },
      { timestampNs: '1001000000' },
    ];
    // span = 2_000_000 ns = 2.0 ms
    expect(totalSpanLabel(entries)).toBe('2.0 ms');
  });

  test('ignores null timestamps when computing span', () => {
    const entries = [
      { timestampNs: null },
      { timestampNs: '1000000000' },
      { timestampNs: '1001500000' },
      { timestampNs: null },
    ];
    // span = 1_500_000 ns = 1.5 ms
    expect(totalSpanLabel(entries)).toBe('1.5 ms');
  });

  test('formats a nanosecond-level span correctly', () => {
    const entries = [
      { timestampNs: '1000000000000' },
      { timestampNs: '1000000000042' },
    ];
    // span = 42 ns
    expect(totalSpanLabel(entries)).toBe('42 ns');
  });

  test('formats a second-level span correctly', () => {
    const entries = [
      { timestampNs: '1000000000000' },
      { timestampNs: '1002500000000' },
    ];
    // span = 2_500_000_000 ns = 2.50 s
    expect(totalSpanLabel(entries)).toBe('2.50 s');
  });
});
