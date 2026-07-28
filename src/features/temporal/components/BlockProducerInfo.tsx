// SPDX-License-Identifier: LicenseRef-Blockscout

/**
 * BlockProducerInfo
 *
 * Displays two rows on the block detail page after "Temporal timestamp":
 *   1. Block producer — "Validator {N}" with their UTC distance
 *   2. Producer time quality — mesh quality percentage at block production
 *
 * Data source: GET /api/v2/temporal/mesh-state
 * The mesh-state endpoint always reflects the most-recent block producer,
 * so it is always fresh for the latest blocks and is immutable for older ones.
 */

import { chakra, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import {
  fetchTemporalProducerInfo,
  formatRootDistanceNs,
  qualityColor,
} from 'src/features/temporal/api/temporal-mesh-rpc';

import * as DetailedInfo from 'src/shared/detailed-info/DetailedInfo';

import { Skeleton } from 'src/toolkit/chakra/skeleton';

interface Props {
  blockNumber: number;
}

const BlockProducerInfo = ({ blockNumber }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'temporal_producer_info', blockNumber ],
    queryFn: fetchTemporalProducerInfo,
    retry: false,
    // Producer info for the latest block changes each block.
    // We accept stale data for display purposes since this is informational only.
    staleTime: 6_000,
  });

  // Don't render anything on error — the block page must continue working.
  if (isError || (!isLoading && data === null)) {
    return null;
  }

  const rootDistanceLabel = data ?
    formatRootDistanceNs(data.producerRootDistanceNs) :
    '';

  const qColor = data ? qualityColor(data.qualityPercent) : 'text.secondary';

  return (
    <>
      <DetailedInfo.ItemLabel
        hint="The validator that produced this block and their clock distance from UTC as measured by the temporal mesh"
        isLoading={ isLoading }
      >
        Block producer
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        <Skeleton loading={ isLoading }>
          <chakra.span fontWeight="medium">
            Validator { data?.producerAuthorityIndex ?? '' }
          </chakra.span>
          { data && (
            <Text as="span" ml={ 2 } color="text.secondary" fontSize="sm">
              ({ rootDistanceLabel })
            </Text>
          ) }
        </Skeleton>
      </DetailedInfo.ItemValue>

      <DetailedInfo.ItemLabel
        hint="Mesh quality percentage recorded at the moment this block was produced; higher values indicate tighter time synchronisation across validators"
        isLoading={ isLoading }
      >
        Producer time quality
      </DetailedInfo.ItemLabel>
      <DetailedInfo.ItemValue>
        <Skeleton loading={ isLoading }>
          <chakra.span
            color={ qColor }
            fontFamily="mono"
            fontWeight="semibold"
          >
            { data !== undefined && data !== null ? `${ data.qualityPercent }%` : '' }
          </chakra.span>
        </Skeleton>
      </DetailedInfo.ItemValue>
    </>
  );
};

export default BlockProducerInfo;
