// SPDX-License-Identifier: LicenseRef-Blockscout

import type { ApiPromise } from '@polkadot/api';

export interface LookupKey {
  type: string;
  label: string;
  hint: string;
  blockNumber: boolean;
}

export function describeKey(type: string, pallet: string, item: string, index: number): LookupKey {
  const blockNumber = index === 0 && [ 'TimeSync.BlockTimeQuality', 'System.BlockHash' ].includes(`${ pallet }.${ item }`);
  const integer = /^u\d+$/.test(type);
  const account = /AccountId|H160/.test(type);
  let label = `Key ${ index + 1 }`;
  let hint = 'Enter a value of the displayed type. Use JSON for tuples, arrays, or structured keys.';
  if (integer) hint = 'Enter a whole number, without commas. Large numbers are kept as text to preserve precision.';
  if (account) {
    label = 'Account address';
    hint = 'Paste a chain account address, or choose an existing account below.';
  }
  if (blockNumber) {
    label = 'Block number';
    hint = 'Choose an existing block below, or enter its number. Older records may have been pruned.';
  }
  return { type, blockNumber, label, hint };
}

export function keyValue(text: string, type: string): unknown {
  const value = text.trim();
  if (!value) throw new Error('Enter a value.');
  const integer = /^([ui])(\d+)$/.exec(type);
  if (integer) {
    if (!/^-?\d+$/.test(value)) throw new Error('Enter a whole number without commas or a decimal point.');
    const number = BigInt(value);
    const bits = BigInt(integer[2]);
    const signed = integer[1] === 'i';
    const min = signed ? -(BigInt(1) << (bits - BigInt(1))) : BigInt(0);
    const max = signed ? (BigInt(1) << (bits - BigInt(1))) - BigInt(1) : (BigInt(1) << bits) - BigInt(1);
    if (number < min || number > max) throw new Error(`Enter a value from ${ min } to ${ max }.`);
    return value;
  }
  if (/^[[{"]/.test(value) || value === 'true' || value === 'false') {
    try {
      return JSON.parse(value);
    } catch {
      throw new Error('Enter valid JSON for this key.');
    }
  }
  return value;
}

export function parseLookupKeys(registry: ApiPromise['registry'], keys: Array<LookupKey>, values: Array<string>, raw?: string): Array<unknown> {
  let parsed: Array<unknown>;
  if (raw !== undefined) {
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch {
      throw new Error('Keys must be a valid JSON array.');
    }
    if (!Array.isArray(json)) throw new Error('Keys must be a JSON array.');
    if (json.length !== keys.length) throw new Error(`This lookup needs ${ keys.length } key value(s); you supplied ${ json.length }.`);
    parsed = json;
  } else {
    parsed = keys.map((key, index) => {
      try {
        return keyValue(values[index] ?? '', key.type);
      } catch (error) {
        throw new Error(`${ key.label }: ${ (error as Error).message }`);
      }
    });
  }
  return parsed.map((value, index) => {
    const key = keys[index];
    try {
      if (typeof value === 'number' && !Number.isSafeInteger(value)) throw new Error('Wrap large integers in quotes to preserve precision.');
      if (/^[ui]\d+$/.test(key.type)) value = keyValue(String(value), key.type);
      registry.createType(key.type, value);
      return value;
    } catch (error) {
      throw new Error(`${ key.label } (${ key.type }): ${ (error as Error).message }`);
    }
  });
}
