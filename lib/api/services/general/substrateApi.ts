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
// Sprint 5 — extrinsics, events, block authors, stats
// ---------------------------------------------------------------------------

export interface SubstrateExtrinsic {
  id: number;
  block_number: number;
  block_hash: string | null;
  index_in_block: number;
  pallet: string;
  method: string;
  args: Record<string, unknown> | null;
  args_truncated: boolean;
  signer: string | null;
  signature: string | null;
  tip: string | null;
  era: Record<string, unknown> | null;
  nonce: number | null;
  fee_paid: string | null;
  success: boolean;
  error: Record<string, unknown> | null;
  hash: string | null;
  call_hash: string | null;
  extrinsic_class: 'Inherent' | 'Signed' | 'Unsigned' | string;
}

export interface SubstrateExtrinsicWithEvents extends SubstrateExtrinsic {
  events: Array<SubstrateEvent>;
}

export interface SubstrateEvent {
  id: number;
  block_number: number;
  block_hash: string | null;
  extrinsic_index: number | null;
  phase: 'ApplyExtrinsic' | 'Finalization' | 'Initialization' | string;
  index_in_block: number;
  pallet: string;
  method: string;
  data: Record<string, unknown> | null;
}

export interface SubstrateBlockAuthor {
  block_number: number;
  block_hash: string | null;
  author_index: number;
  author_stash: string | null;
  slot: number | null;
}

export interface SubstrateStats {
  latest_block: number;
  total_extrinsics: number;
  signed_extrinsics_24h: number;
  inherent_extrinsics_24h: number;
  unsigned_extrinsics_24h: number;
  total_events_24h: number;
  avg_extrinsics_per_block: number;
  top_pallets_24h: Array<{ pallet: string; method: string; count: number }>;
  block_authors_24h: Array<{ author_stash: string | null; blocks: number }>;
}

export function fetchBlockExtrinsics(blockNumber: number): Promise<{
  items: Array<SubstrateExtrinsic>;
  author: SubstrateBlockAuthor | null;
}> {
  return fetchJson(`/blocks/${ blockNumber }/extrinsics`);
}

export function fetchBlockEvents(blockNumber: number): Promise<{ items: Array<SubstrateEvent> }> {
  return fetchJson(`/blocks/${ blockNumber }/events`);
}

export function fetchAccountExtrinsics(
  address: string,
  limit = 100,
): Promise<{ items: Array<SubstrateExtrinsic> }> {
  return fetchJson(`/accounts/${ address }/extrinsics?limit=${ limit }`);
}

export function fetchExtrinsicByHash(hash: string): Promise<SubstrateExtrinsicWithEvents | null> {
  return fetchJsonOrNull(`/extrinsics/${ hash }`);
}

export interface SubstrateExtrinsicCursor {
  block_number: number;
  index_in_block: number;
}

export function fetchRecentExtrinsics(opts: {
  pallet?: string;
  method?: string;
  limit?: number;
  cursor?: SubstrateExtrinsicCursor | null;
} = {}): Promise<{ items: Array<SubstrateExtrinsic>; next_page_params: SubstrateExtrinsicCursor | null }> {
  const params = new URLSearchParams();
  if (opts.pallet) params.set('pallet', opts.pallet);
  if (opts.method) params.set('method', opts.method);
  if (opts.limit !== undefined) params.set('limit', String(opts.limit));
  if (opts.cursor) {
    params.set('block_number', String(opts.cursor.block_number));
    params.set('index_in_block', String(opts.cursor.index_in_block));
  }
  const q = params.toString();
  return fetchJson(`/extrinsics/recent${ q ? `?${ q }` : '' }`);
}

export function fetchSubstrateStats(): Promise<SubstrateStats> {
  return fetchJson('/stats');
}

export interface SubstrateSearchHit {
  kind: 'block' | 'extrinsic';
  block_number: number;
  index_in_block?: number;
}

export function searchSubstrateHash(hash: string): Promise<SubstrateSearchHit | null> {
  return fetchJsonOrNull(`/search/${ hash }`);
}

/**
 * True if an `ethereum.transact` row should deep-link to the existing
 * Blockscout EVM tx page instead of the substrate extrinsic detail page.
 */
export function isEthereumTransactExtrinsic(ext: Pick<SubstrateExtrinsic, 'pallet' | 'method'>): boolean {
  return ext.pallet === 'Ethereum' && ext.method === 'transact';
}

/**
 * Stringify an extrinsic's args jsonb for inline table-cell display.
 * Returns a compact one-line representation with byte-array hex preserved.
 */
export function summarizeArgs(args: Record<string, unknown> | null, maxLen = 80): string {
  if (!args) return '—';
  if (args.args_truncated) return `(truncated, ${ args.size_bytes } bytes)`;
  const s = JSON.stringify(args);
  if (s.length <= maxLen) return s;
  return `${ s.slice(0, maxLen - 1) }…`;
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
