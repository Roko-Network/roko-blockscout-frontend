// SPDX-License-Identifier: LicenseRef-Blockscout

import { Grid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import PageTitle from 'src/shell/page/title/PageTitle';

import {
  fetchTemporalConsensusTime,
  fetchTemporalMetrics,
  fetchTemporalQueueStats,
  fetchTemporalWatermark,
} from 'src/features/temporal/api/temporal-rpc';
import TemporalConsensusCard from 'src/features/temporal/components/TemporalConsensusCard';
import TemporalMetricsCard from 'src/features/temporal/components/TemporalMetricsCard';
import TemporalQueueCard from 'src/features/temporal/components/TemporalQueueCard';
import TemporalWatermarkCard from 'src/features/temporal/components/TemporalWatermarkCard';

import { SECOND } from 'src/toolkit/utils/consts';

const BLOCK_TIME_MS = 6 * SECOND;

const Temporal = () => {
  const watermarkQuery = useQuery({
    queryKey: [ 'temporal_watermark' ],
    queryFn: fetchTemporalWatermark,
    refetchInterval: BLOCK_TIME_MS,
  });

  const consensusTimeQuery = useQuery({
    queryKey: [ 'temporal_consensus_time' ],
    queryFn: fetchTemporalConsensusTime,
    refetchInterval: BLOCK_TIME_MS,
  });

  const queueStatsQuery = useQuery({
    queryKey: [ 'temporal_queue_stats' ],
    queryFn: fetchTemporalQueueStats,
    refetchInterval: BLOCK_TIME_MS,
  });

  const metricsQuery = useQuery({
    queryKey: [ 'temporal_metrics' ],
    queryFn: fetchTemporalMetrics,
    refetchInterval: BLOCK_TIME_MS,
  });

  const isLoading =
    watermarkQuery.isLoading ||
    consensusTimeQuery.isLoading ||
    queueStatsQuery.isLoading ||
    metricsQuery.isLoading;

  return (
    <>
      <PageTitle
        title="Temporal Dashboard"
        secondRow={ (
          <Text fontSize="sm" color="text.secondary">
            Nanosecond-precision temporal ordering — The Temporal Layer for Web3
          </Text>
        ) }
      />

      <Grid
        templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
        gap={ 6 }
        mt={ 2 }
      >
        <TemporalWatermarkCard
          data={ watermarkQuery.data }
          isLoading={ isLoading }
        />

        <TemporalConsensusCard
          data={ consensusTimeQuery.data }
          isLoading={ isLoading }
        />

        <TemporalQueueCard
          data={ queueStatsQuery.data }
          isLoading={ isLoading }
        />

        <TemporalMetricsCard
          data={ metricsQuery.data }
          isLoading={ isLoading }
        />
      </Grid>
    </>
  );
};

export default Temporal;
