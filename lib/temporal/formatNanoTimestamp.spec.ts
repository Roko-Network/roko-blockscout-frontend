import { describe, expect, test } from 'vitest';

import { formatNanoTimestamp, nanoToDatetime } from './formatNanoTimestamp';

describe('nanoToDatetime', () => {
  test('converts a nanosecond timestamp string to an ISO datetime string', () => {
    // 1711234567890123456 ns => 1711234567890.123456 ms
    const result = nanoToDatetime('1711234567890123456');
    expect(typeof result).toBe('string');
    expect(isNaN(new Date(result).getTime())).toBe(false);
  });

  test('handles the zero timestamp', () => {
    const result = nanoToDatetime('0');
    expect(typeof result).toBe('string');
    expect(isNaN(new Date(result).getTime())).toBe(false);
  });

  test('produces a datetime close to epoch for near-zero ns', () => {
    const result = nanoToDatetime('1000000'); // 1 ms after epoch
    const d = new Date(result);
    expect(d.getTime()).toBe(1);
  });
});

describe('formatNanoTimestamp', () => {
  test('returns a human-readable datetime string', () => {
    const result = formatNanoTimestamp('1711234567890123456');
    // Should not be an empty string
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  test('includes the year 2024 for a known 2024 timestamp', () => {
    // 1711234567890123456 ns is around March 2024
    const result = formatNanoTimestamp('1711234567890123456');
    expect(result).toContain('2024');
  });

  test('includes nanosecond precision digits', () => {
    // The last 9 digits of the raw ns value should appear in the formatted output
    const result = formatNanoTimestamp('1711234567890123456');
    // raw ns fraction within the second is 890123456
    expect(result).toContain('123456');
  });

  test('handles zero gracefully', () => {
    const result = formatNanoTimestamp('0');
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });
});
