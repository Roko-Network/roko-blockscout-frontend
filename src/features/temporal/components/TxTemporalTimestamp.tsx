import { Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { fetchTemporalTxTimestamp } from 'src/features/temporal/api/temporal-rpc';
import { formatNanoTimestamp } from 'src/features/temporal/utils/formatNanoTimestamp';
import * as DetailedInfo from 'src/shared/detailed-info/DetailedInfo';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

interface Props {
  txHash: string;
}

const TxTemporalTimestamp = ({ txHash }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'temporal_tx_timestamp', txHash ],
    queryFn: () => fetchTemporalTxTimestamp(txHash),
    retry: false,
    staleTime: Infinity,
  });

  if (isError || (!isLoading && (!data || !data.timestamp_ns))) {
    return null;
  }

  const formatted = data ? formatNanoTimestamp(data.timestamp_ns) : '';
  const raw = data?.timestamp_ns ?? '';

  return (
    <>
      <DetailedInfo.ItemLabel
        hint="Nanosecond-precision canonical timestamp assigned to this transaction by the Roko temporal layer"
        isLoading={ isLoading }
      >
        Temporal timestamp
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        <VStack alignItems="flex-start" gap={ 0 }>
          <Skeleton loading={ isLoading }>
            <Text>{ formatted }</Text>
          </Skeleton>
          <Skeleton loading={ isLoading }>
            <Text fontSize="xs" color="text.secondary" fontFamily="mono">
              { raw } ns
            </Text>
          </Skeleton>
        </VStack>
      </DetailedInfo.ItemValue>
    </>
  );
};

export default TxTemporalTimestamp;
