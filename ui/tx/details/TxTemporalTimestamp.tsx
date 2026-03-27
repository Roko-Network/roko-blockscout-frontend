import { Flex, Text, VStack } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { fetchTemporalTxTimestamp } from 'lib/api/services/general/temporalRpc';
import { formatNanoTimestamp } from 'lib/temporal/formatNanoTimestamp';
import { Skeleton } from 'toolkit/chakra/skeleton';
import * as DetailedInfo from 'ui/shared/DetailedInfo/DetailedInfo';

interface Props {
  txHash: string;
  blockTimestamp?: string; // ISO string from Blockscout's standard timestamp
}

function formatWaitTime(waitNs: string): string {
  const ns = Number(waitNs);
  if (isNaN(ns)) return waitNs;
  if (ns < 1000000) {
    return `${ns} ns`;
  }
  const ms = ns / 1000000;
  if (ms < 1000) {
    return `${ms.toFixed(1)} ms`;
  }
  return `${(ms / 1000).toFixed(2)} s`;
}

const TxTemporalTimestamp = ({ txHash, blockTimestamp }: Props) => {
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

  // Compute wait time: difference between timestamping and block inclusion
  const waitDisplay = (() => {
    if (data?.wait_ns) {
      return formatWaitTime(data.wait_ns);
    }
    if (data?.timestamp_ns && blockTimestamp) {
      try {
        const stampMs = Number(data.timestamp_ns) / 1000000;
        const blockMs = new Date(blockTimestamp).getTime();
        if (blockMs > stampMs) {
          const diffNs = Math.round((blockMs - stampMs) * 1000000);
          return formatWaitTime(String(diffNs));
        }
      } catch {
        // ignore
      }
    }
    return null;
  })();

  return (
    <>
      <DetailedInfo.ItemLabel
        hint="Nanosecond-precision timestamp assigned when this transaction was received by the validator pool — proves when it was first seen by the network"
        isLoading={ isLoading }
      >
        Timestamping time
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        <VStack alignItems="flex-start" gap={ 0 }>
          <Skeleton loading={ isLoading }>
            <Text>{ formatted }</Text>
          </Skeleton>
          <Skeleton loading={ isLoading }>
            <Flex gap={ 2 } alignItems="center">
              <Text fontSize="xs" color="text.secondary" fontFamily="mono">
                { raw } ns
              </Text>
              { waitDisplay && (
                <Text fontSize="xs" color="#0078D4" fontWeight={ 600 }>
                  waited { waitDisplay }
                </Text>
              ) }
            </Flex>
          </Skeleton>
        </VStack>
      </DetailedInfo.ItemValue>
    </>
  );
};

export default TxTemporalTimestamp;
