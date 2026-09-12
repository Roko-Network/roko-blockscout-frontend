// SPDX-License-Identifier: LicenseRef-Blockscout

import { useQuery } from '@tanstack/react-query';
import React from 'react';

import StatsWidget from 'src/shared/stats/StatsWidget';

export const SUMMARY_URL = 'https://index.roko.network/static/transactions/summary.json';

export interface TransactionSummary {
  schemaVersion: number;
  chainId: number;
  complete: boolean;
  expiresAt: string;
  windowSeconds: number;
  counts: { evm: number; nativeSigned: number; total: number };
}

export function validSummary(data: TransactionSummary): boolean {
  const counts = data?.counts;
  return data?.schemaVersion === 1 && data.chainId === 52370 && data.complete === true &&
    data.windowSeconds === 86400 && Date.parse(data.expiresAt) > Date.now() &&
    Boolean(counts && [ counts.evm, counts.nativeSigned, counts.total ].every(value => Number.isSafeInteger(value) && value >= 0) &&
      counts.total === counts.evm + counts.nativeSigned);
}

export async function fetchTransactionSummary(): Promise<TransactionSummary> {
  const response = await fetch(SUMMARY_URL);
  if (!response.ok) throw new Error('Transaction summary unavailable');
  const data = await response.json();
  if (!validSummary(data)) throw new Error('Transaction summary incomplete or expired');
  return data;
}

const UserTransactions24h = () => {
  const query = useQuery({
    queryKey: [ 'public_index_transactions_24h' ],
    queryFn: fetchTransactionSummary,
    refetchInterval: 30_000,
    staleTime: 15_000,
    retry: 1,
  });
  const current = !query.isError && query.data && validSummary(query.data);

  return (
    <StatsWidget
      label="User transactions"
      value={ current ? query.data.counts.total.toLocaleString() : 'Unavailable' }
      period="24h"
      isLoading={ query.isPending }
    />
  );
};

export default React.memo(UserTransactions24h);
