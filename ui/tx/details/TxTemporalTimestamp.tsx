import { Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { fetchTemporalTxTimestamp, fetchTemporalBlockMetadata } from 'lib/api/services/general/temporalRpc';
import { formatNanoTimestamp } from 'lib/temporal/formatNanoTimestamp';
import { Skeleton } from 'toolkit/chakra/skeleton';
import * as DetailedInfo from 'ui/shared/DetailedInfo/DetailedInfo';

interface Props {
  txHash: string;
  blockNumber?: number;
}

const TxTemporalTimestamp = ({ txHash, blockNumber }: Props) => {
  // Try per-tx timestamp first
  const txQuery = useQuery({
    queryKey: [ 'temporal_tx_timestamp', txHash ],
    queryFn: () => fetchTemporalTxTimestamp(txHash),
    retry: false,
    staleTime: Infinity,
  });

  // Fall back to block temporal metadata if per-tx not available
  const blockQuery = useQuery({
    queryKey: [ 'temporal_block_metadata', blockNumber ],
    queryFn: () => fetchTemporalBlockMetadata(blockNumber ?? 0),
    enabled: !!blockNumber && (txQuery.isError || (!txQuery.isLoading && !txQuery.data?.timestamp_ns)),
    retry: false,
    staleTime: Infinity,
  });

  const isLoading = txQuery.isLoading || (blockQuery.isInitialLoading);

  // Use tx timestamp if available, otherwise block timestamp
  const timestampNs = txQuery.data?.timestamp_ns || (blockQuery.data ? String(blockQuery.data.block_nano_timestamp) : '');
  const isBlockFallback = !txQuery.data?.timestamp_ns && !!blockQuery.data;

  if (!isLoading && !timestampNs) {
    return (
      <>
        <DetailedInfo.ItemLabel
          hint="Nanosecond-precision canonical timestamp assigned by the Roko temporal layer"
        >
          Temporal timestamp
        </DetailedInfo.ItemLabel>
        <DetailedInfo.ItemValue>
          <Text color="text.secondary">—</Text>
        </DetailedInfo.ItemValue>
      </>
    );
  }

  const formatted = timestampNs ? formatNanoTimestamp(timestampNs) : '';

  return (
    <>
      <DetailedInfo.ItemLabel
        hint="Nanosecond-precision canonical timestamp assigned by the Roko temporal layer"
        isLoading={ isLoading }
      >
        Temporal timestamp
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        <VStack alignItems="flex-start" gap={ 0 }>
          <Skeleton loading={ isLoading }>
            <Text>{ formatted }{ isBlockFallback ? ' (block)' : '' }</Text>
          </Skeleton>
          <Skeleton loading={ isLoading }>
            <Text fontSize="xs" color="text.secondary" fontFamily="mono">
              { timestampNs } ns
            </Text>
          </Skeleton>
        </VStack>
      </DetailedInfo.ItemValue>
    </>
  );
};

export default TxTemporalTimestamp;
