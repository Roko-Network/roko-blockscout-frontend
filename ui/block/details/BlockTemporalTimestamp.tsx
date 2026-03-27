import { Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { fetchTemporalBlockMetadata } from 'lib/api/services/general/temporalRpc';
import { formatNanoTimestamp } from 'lib/temporal/formatNanoTimestamp';
import { Skeleton } from 'toolkit/chakra/skeleton';
import * as DetailedInfo from 'ui/shared/DetailedInfo/DetailedInfo';

interface Props {
  blockNumber: number;
}

const BlockTemporalTimestamp = ({ blockNumber }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'temporal_block_metadata', blockNumber ],
    queryFn: () => fetchTemporalBlockMetadata(blockNumber),
    retry: false,
    // Block temporal metadata is immutable once produced.
    staleTime: Infinity,
  });

  if (isError || (!isLoading && !data)) {
    return (
      <>
        <DetailedInfo.ItemLabel
          hint="Nanosecond-precision timestamp of when this block was produced according to the validator time mesh"
        >
          Timestamping time
        </DetailedInfo.ItemLabel>
        <DetailedInfo.ItemValue>
          <Text color="text.secondary">—</Text>
        </DetailedInfo.ItemValue>
      </>
    );
  }

  const formatted = data ? formatNanoTimestamp(data.block_nano_timestamp) : '';
  const raw = data?.block_nano_timestamp ?? '';

  return (
    <>
      <DetailedInfo.ItemLabel
        hint="Nanosecond-precision temporal timestamp for this block produced by the Roko temporal layer"
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

export default BlockTemporalTimestamp;
