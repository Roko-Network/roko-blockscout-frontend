// SPDX-License-Identifier: LicenseRef-Blockscout

import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { fetchTemporalTxTimestamps } from 'src/features/temporal/api/temporal-rpc';

export default function useTemporalTxTimestamps(txHashes: Array<string | null | undefined>) {
  const hashes = React.useMemo(
    () => Array.from(new Set(txHashes.filter((hash): hash is string => Boolean(hash)))).sort(),
    [ txHashes ],
  );

  return useQuery({
    queryKey: [ 'temporal_tx_timestamps', hashes ],
    queryFn: () => fetchTemporalTxTimestamps(hashes),
    enabled: hashes.length > 0,
    retry: false,
    staleTime: Infinity,
  });
}
