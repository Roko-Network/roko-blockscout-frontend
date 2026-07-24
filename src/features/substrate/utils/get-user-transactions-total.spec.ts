import { describe, expect, it } from 'vitest';

import getUserTransactionsTotal from './get-user-transactions-total';

describe('getUserTransactionsTotal', () => {
  it('adds native signed transactions to the EVM total', () => {
    expect(getUserTransactionsTotal('4', 1)).toBe(5);
  });

  it('preserves the EVM total while native stats are unavailable', () => {
    expect(getUserTransactionsTotal('4', undefined)).toBe(4);
  });

  it('does not invent a total before the EVM aggregate is available', () => {
    expect(getUserTransactionsTotal(undefined, 1)).toBeUndefined();
  });
});
