// SPDX-License-Identifier: LicenseRef-Blockscout

import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { fetchTemporalBlockTimestamps } from 'src/features/temporal/api/temporal-rpc';

export default function useTemporalBlockTimestamps(blockNumbers: Array<number | null | undefined>) {
  const numbers = React.useMemo(
    () => Array.from(new Set(blockNumbers.filter((number): number is number => typeof number === 'number'))).sort((a, b) => a - b),
    [ blockNumbers ],
  );

  return useQuery({
    queryKey: [ 'temporal_block_timestamps', numbers ],
    queryFn: () => fetchTemporalBlockTimestamps(numbers),
    enabled: numbers.length > 0,
    retry: false,
    staleTime: Infinity,
  });
}
