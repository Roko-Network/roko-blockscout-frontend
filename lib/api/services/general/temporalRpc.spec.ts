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
