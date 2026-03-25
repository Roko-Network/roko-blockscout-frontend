/**
 * Utilities for formatting nanosecond-precision timestamps.
 *
 * JS Date only has millisecond precision, so we carry the full nanosecond
 * value as a BigInt string and format the sub-millisecond digits ourselves.
 */

/**
 * Convert a nanosecond timestamp string to an ISO 8601 datetime string.
 * Precision is millisecond-level (the ns string is divided by 1_000_000).
 */
export function nanoToDatetime(nsStr: string): string {
  // Use BigInt arithmetic to avoid floating-point loss.
  const ns = BigInt(nsStr);
  const ms = ns / BigInt(1_000_000);
  return new Date(Number(ms)).toISOString();
}

/**
 * Format a nanosecond timestamp string into a human-readable datetime with
 * nanosecond precision.
 *
 * Format: "YYYY-MM-DD HH:mm:ss.nnnnnnnnn UTC"
 * The nanosecond fractional part (9 digits) is derived from the raw ns value.
 */
export function formatNanoTimestamp(nsStr: string): string {
  const ns = BigInt(nsStr);
  const ms = ns / BigInt(1_000_000);
  const date = new Date(Number(ms));

  // Extract the nanosecond fraction within the current second (9 digits).
  const nsInSecond = ns % BigInt(1_000_000_000);
  const nsFraction = nsInSecond.toString().padStart(9, '0');

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${ year }-${ month }-${ day } ${ hours }:${ minutes }:${ seconds }.${ nsFraction } UTC`;
}
