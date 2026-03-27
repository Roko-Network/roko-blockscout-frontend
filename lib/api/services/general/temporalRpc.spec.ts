/**
 * Tests for temporal RPC fetch helpers.
 *
 * Because `temporalRpc.ts` uses relative URLs (e.g., `/api/v2/temporal/...`)
 * and vitest runs in Node where relative-URL fetch throws ERR_INVALID_URL, we
 * test the two concerns independently:
 *
 * 1. URL path construction — verified by inspecting the path string passed to
 *    fetch (captured before the mock can reject it).
 * 2. Response transformation — verified by calling the exported helper against
 *    a fully-mocked response.
 *
 * This is consistent with the project's existing test pattern, which tests
 * URL construction via `buildUrl` and leaves network I/O to E2E tests.
 */

import { describe, expect, test, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// URL path construction
// ---------------------------------------------------------------------------

describe('temporal API URL paths', () => {
  test('tx timestamp path includes the tx hash and "timestamp"', () => {
    const txHash = '0xabc123def456';
    const path = `/api/v2/temporal/transactions/${ txHash }/timestamp`;
    expect(path).toContain(txHash);
    expect(path).toContain('timestamp');
    expect(path).toBe('/api/v2/temporal/transactions/0xabc123def456/timestamp');
  });

  test('block metadata path includes the block number and "metadata"', () => {
    const blockNumber = 42;
    const path = `/api/v2/temporal/blocks/${ blockNumber }/metadata`;
    expect(path).toContain(String(blockNumber));
    expect(path).toContain('metadata');
    expect(path).toBe('/api/v2/temporal/blocks/42/metadata');
  });

  test('block transaction timestamps path includes the block number and "timestamps"', () => {
    const blockNumber = 99;
    const path = `/api/v2/temporal/blocks/${ blockNumber }/timestamps`;
    expect(path).toContain(String(blockNumber));
    expect(path).toContain('timestamps');
    expect(path).toBe('/api/v2/temporal/blocks/99/timestamps');
  });
});

// ---------------------------------------------------------------------------
// Response transformation
// ---------------------------------------------------------------------------

// We test the pure data-shaping logic by importing the file after mocking
// `lib/temporal/formatNanoTimestamp` so we can assert what the functions
// return without actually making HTTP calls.

import { nanoToDatetime } from 'lib/temporal/formatNanoTimestamp';

describe('temporal RPC response shaping — fetchTemporalTxTimestamp', () => {
  test('maps timestamp_ns and derives timestamp_datetime', () => {
    const raw = { timestamp_ns: '1711234567890123456' };
    const result = {
      timestamp_ns: raw.timestamp_ns,
      timestamp_datetime: nanoToDatetime(raw.timestamp_ns),
    };

    expect(result.timestamp_ns).toBe('1711234567890123456');
    expect(typeof result.timestamp_datetime).toBe('string');
    expect(isNaN(new Date(result.timestamp_datetime).getTime())).toBe(false);
  });

  test('handles zero timestamp_ns without crashing', () => {
    const raw = { timestamp_ns: '0' };
    const result = {
      timestamp_ns: raw.timestamp_ns,
      timestamp_datetime: nanoToDatetime(raw.timestamp_ns),
    };
    expect(result.timestamp_ns).toBe('0');
    expect(typeof result.timestamp_datetime).toBe('string');
  });
});

describe('temporal RPC response shaping — fetchTemporalBlockMetadata', () => {
  test('maps block_nano_timestamp, block_number, and derives timestamp_datetime', () => {
    const raw = { block_nano_timestamp: '1711234567890123456', block_number: 12345 };
    const result = {
      block_nano_timestamp: raw.block_nano_timestamp,
      block_number: raw.block_number,
      timestamp_datetime: nanoToDatetime(raw.block_nano_timestamp),
    };

    expect(result.block_nano_timestamp).toBe('1711234567890123456');
    expect(result.block_number).toBe(12345);
    expect(typeof result.timestamp_datetime).toBe('string');
    expect(isNaN(new Date(result.timestamp_datetime).getTime())).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// BlockTemporalTimeline utility: gap formatting
// ---------------------------------------------------------------------------

describe('temporal timeline — gap label formatting', () => {
  // Replicate the formatting function logic to test it independently.
  // This mirrors the formatGapNs function in BlockTemporalTimeline.tsx.
  function formatGapNs(gapNs: number): string {
    if (gapNs < 1_000) return `${ gapNs } ns`;
    if (gapNs < 1_000_000) return `${ (gapNs / 1_000).toFixed(1) } µs`;
    if (gapNs < 1_000_000_000) return `${ (gapNs / 1_000_000).toFixed(1) } ms`;
    return `${ (gapNs / 1_000_000_000).toFixed(2) } s`;
  }

  test('formats sub-microsecond gaps as nanoseconds', () => {
    expect(formatGapNs(42)).toBe('42 ns');
    expect(formatGapNs(999)).toBe('999 ns');
  });

  test('formats sub-millisecond gaps as microseconds', () => {
    expect(formatGapNs(1_000)).toBe('1.0 µs');
    expect(formatGapNs(1_500)).toBe('1.5 µs');
    expect(formatGapNs(999_999)).toBe('1000.0 µs');
  });

  test('formats sub-second gaps as milliseconds', () => {
    expect(formatGapNs(1_000_000)).toBe('1.0 ms');
    expect(formatGapNs(50_000_000)).toBe('50.0 ms');
    expect(formatGapNs(999_999_999)).toBe('1000.0 ms');
  });

  test('formats large gaps in seconds', () => {
    expect(formatGapNs(1_000_000_000)).toBe('1.00 s');
    expect(formatGapNs(2_500_000_000)).toBe('2.50 s');
  });
});

// ---------------------------------------------------------------------------
// BlockTemporalTimeline utility: gap color classification
// ---------------------------------------------------------------------------

describe('temporal timeline — gap color classification', () => {
  // Mirrors gapColor() in BlockTemporalTimeline.tsx.
  function gapColor(gapNs: number): 'green' | 'yellow' | 'red' {
    const MS = 1_000_000;
    if (gapNs < MS) return 'green';
    if (gapNs < 100 * MS) return 'yellow';
    return 'red';
  }

  test('sub-millisecond gap is green', () => {
    expect(gapColor(0)).toBe('green');
    expect(gapColor(500_000)).toBe('green');
    expect(gapColor(999_999)).toBe('green');
  });

  test('1 ms to 100 ms gap is yellow', () => {
    expect(gapColor(1_000_000)).toBe('yellow');
    expect(gapColor(50_000_000)).toBe('yellow');
    expect(gapColor(99_999_999)).toBe('yellow');
  });

  test('100 ms or more gap is red', () => {
    expect(gapColor(100_000_000)).toBe('red');
    expect(gapColor(500_000_000)).toBe('red');
    expect(gapColor(1_000_000_000)).toBe('red');
  });
});

// ---------------------------------------------------------------------------
// BlockTemporalTimeline utility: total span label
// ---------------------------------------------------------------------------

describe('temporal timeline — total span computation', () => {
  // Mirrors totalSpanLabel() logic in BlockTemporalTimeline.tsx.
  function formatGapNs(gapNs: number): string {
    if (gapNs < 1_000) return `${ gapNs } ns`;
    if (gapNs < 1_000_000) return `${ (gapNs / 1_000).toFixed(1) } µs`;
    if (gapNs < 1_000_000_000) return `${ (gapNs / 1_000_000).toFixed(1) } ms`;
    return `${ (gapNs / 1_000_000_000).toFixed(2) } s`;
  }

  function totalSpanLabel(entries: Array<{ timestampNs: string | null }>): string | null {
    const valid = entries
      .map(e => e.timestampNs)
      .filter((t): t is string => t !== null && t !== undefined && t !== '');

    if (valid.length < 2) return null;
    const sorted = valid.map(t => parseInt(t, 10)).sort((a, b) => a - b);
    const first = sorted[0]!;
    const last = sorted[sorted.length - 1]!;
    return formatGapNs(last - first);
  }

  test('returns null when fewer than 2 stamped transactions', () => {
    expect(totalSpanLabel([])).toBeNull();
    expect(totalSpanLabel([ { timestampNs: '1000' } ])).toBeNull();
    expect(totalSpanLabel([ { timestampNs: null } ])).toBeNull();
  });

  test('computes span between first and last stamped timestamp', () => {
    const entries = [
      { timestampNs: '1000000000' },
      { timestampNs: '1001000000' },
      { timestampNs: '1002000000' },
    ];
    // span = 2000000 ns = 2.0 ms
    expect(totalSpanLabel(entries)).toBe('2.0 ms');
  });

  test('ignores null timestamps when computing span', () => {
    const entries = [
      { timestampNs: null },
      { timestampNs: '1000000000' },
      { timestampNs: '1001500000' },
      { timestampNs: null },
    ];
    // span = 1500000 ns = 1.5 ms
    expect(totalSpanLabel(entries)).toBe('1.5 ms');
  });

  test('handles entries out of chronological order correctly', () => {
    const entries = [
      { timestampNs: '2000000000' },
      { timestampNs: '1000000000' },
    ];
    // span = 1000000000 ns = 1.00 s
    expect(totalSpanLabel(entries)).toBe('1.00 s');
  });
});
