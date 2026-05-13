/**
 * Fetch helpers for the substrate-native endpoints exposed by the backend at
 * `/api/v2/substrate/*`. These are read-only views of data indexed by
 * `roko-indexer-sidecar` into the Postgres `roko.*` schema.
 *
 * The temporal mesh + on-chain validator surfaces live in `temporalMeshRpc.ts`;
 * this file is for the substrate-native (per-era, per-validator, pwROKO)
 * data set introduced in Sprint 2/4.
 */

const SUBSTRATE_API = '/api/v2/substrate';

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${ SUBSTRATE_API }${ path }`);
  if (!res.ok) {
    throw new Error(`API error: ${ res.status }`);
  }
  return res.json() as Promise<T>;
}

async function fetchJsonOrNull<T>(path: string): Promise<T | null> {
  const res = await fetch(`${ SUBSTRATE_API }${ path }`);
  if (res.status === 404) {
    return null;
  }
  if (!res.ok) {
    throw new Error(`API error: ${ res.status }`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Response shapes
// ---------------------------------------------------------------------------

export interface SubstrateValidator {
  stash: string;
  controller: string | null;
  authority_index: number;
  session_keys: Record<string, string> | null;
  commission_pct: string | null;
  bonded_amount: string | null;
  status: 'active' | 'waiting' | 'inactive' | string;
  first_seen_block: number;
  last_updated_block: number;
}

export interface SubstrateViolation {
  id: number;
  block_number: number;
  block_hash: string;
  extrinsic_index: number | null;
  stash: string;
  authority_index: number;
  kind: string;
  severity: string;
  detail: Record<string, unknown> | null;
  escalated: boolean;
  recorded_at: string | null;
}

export interface SubstrateEra {
  era_index: number;
  start_block: number | null;
  end_block: number | null;
  start_session: number | null;
  end_session: number | null;
  validator_count: number | null;
  total_stake: string | null;
  validator_payout: string | null;
  remainder_payout: string | null;
  slashed_count: number | null;
  slashed_total: string | null;
  finalized: boolean;
  finalized_at_block: number | null;
}

export interface SubstrateSlash {
  id: number;
  era_index: number;
  block_number: number;
  block_hash: string;
  stash: string;
  offence_kind: string;
  slash_amount: string | null;
  reporters: Array<string>;
  detail: Record<string, unknown> | null;
  recorded_at: string | null;
}

export interface SubstratePwrokoEvent {
  id: number;
  block_number: number;
  block_hash: string;
  extrinsic_index: number | null;
  event_kind: string;
  from_account: string | null;
  to_account: string | null;
  amount: string | null;
  backing_amount: string | null;
  extra: Record<string, unknown> | null;
}

export interface ClockAttestation {
  detected_source: 'Pps' | 'Timebeat' | 'Phc' | 'NtpSynced' | 'SystemOnly' | 'Unknown';
  detected_source_index: number;
  root_distance_ns: number;
  calibration_window_blocks: number;
  attested_at_block: number;
}

// ---------------------------------------------------------------------------
// Validators
// ---------------------------------------------------------------------------

export function fetchSubstrateValidators(): Promise<{ items: Array<SubstrateValidator> }> {
  return fetchJson('/validators');
}

export function fetchSubstrateValidator(stash: string): Promise<SubstrateValidator | null> {
  return fetchJsonOrNull(`/validators/${ stash }`);
}

export function fetchSubstrateValidatorViolations(
  stash: string,
  limit = 100,
): Promise<{ items: Array<SubstrateViolation> }> {
  return fetchJson(`/validators/${ stash }/violations?limit=${ limit }`);
}

export function fetchValidatorClockAttestation(stash: string): Promise<ClockAttestation | null> {
  return fetchJsonOrNull(`/validators/${ stash }/clock-attestation`);
}

// ---------------------------------------------------------------------------
// Eras
// ---------------------------------------------------------------------------

export function fetchSubstrateEras(limit = 20): Promise<{ items: Array<SubstrateEra> }> {
  return fetchJson(`/eras?limit=${ limit }`);
}

export function fetchSubstrateEra(n: number): Promise<SubstrateEra | null> {
  return fetchJsonOrNull(`/eras/${ n }`);
}

export function fetchSubstrateEraSlashes(n: number): Promise<{ items: Array<SubstrateSlash> }> {
  return fetchJson(`/eras/${ n }/slashes`);
}

// ---------------------------------------------------------------------------
// pwROKO
// ---------------------------------------------------------------------------

export function fetchAccountPwrokoHistory(
  address: string,
  limit = 100,
): Promise<{ items: Array<SubstratePwrokoEvent> }> {
  return fetchJson(`/accounts/${ address }/pwroko-history?limit=${ limit }`);
}

// ---------------------------------------------------------------------------
// Slashing (global feed)
// ---------------------------------------------------------------------------

export function fetchRecentSlashes(limit = 50): Promise<{ items: Array<SubstrateSlash> }> {
  return fetchJson(`/slashing?limit=${ limit }`);
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

/**
 * Truncate a 0x-prefixed hex address for table display, mirroring the
 * Blockscout convention: keep first 6 chars after 0x + last 4 chars.
 */
export function truncateHex(hex: string | null | undefined, head = 6, tail = 4): string {
  if (!hex) return '—';
  if (!hex.startsWith('0x')) return hex;
  if (hex.length <= head + tail + 2) return hex;
  return `${ hex.slice(0, 2 + head) }…${ hex.slice(-tail) }`;
}

/**
 * Format a ROKO balance string (18-decimal integer) for display. Returns
 * `—` for nullish input.
 */
export function formatRoko(amount: string | null | undefined, fractionDigits = 4): string {
  if (amount === null || amount === undefined || amount === '') return '—';
  try {
    const wei = BigInt(amount);
    const zero = BigInt(0);
    if (wei === zero) return '0';
    // BigInt() ctor form — `10n ** 18n` literals require ES2020 target which
    // this project does not set globally.
    const divisor = BigInt(10) ** BigInt(18);
    const whole = wei / divisor;
    const fraction = wei % divisor;
    const fractionStr = fraction.toString().padStart(18, '0').slice(0, fractionDigits);
    return fractionDigits > 0 ? `${ whole.toString() }.${ fractionStr }` : whole.toString();
  } catch {
    return amount;
  }
}

/**
 * Tier color for ClockSource badges (S4-T4 design).
 */
export function clockSourceColor(source: ClockAttestation['detected_source']): string {
  switch (source) {
    case 'Pps':
    case 'Phc': return 'green.500';
    case 'Timebeat': return 'blue.500';
    case 'NtpSynced': return 'yellow.500';
    case 'SystemOnly': return 'orange.500';
    default: return 'gray.500';
  }
}
