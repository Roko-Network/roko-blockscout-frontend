import { Grid, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import {
  fetchTemporalConsensusTime,
  fetchTemporalQueueStats,
  fetchTemporalWatermark,
} from 'lib/api/services/general/temporalRpc';
import { SECOND } from 'toolkit/utils/consts';
import PageTitle from 'ui/shared/Page/PageTitle';
import TemporalConsensusCard from 'ui/temporal/TemporalConsensusCard';
import TemporalQueueCard from 'ui/temporal/TemporalQueueCard';
import TemporalWatermarkCard from 'ui/temporal/TemporalWatermarkCard';

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

  const isLoading =
    watermarkQuery.isLoading ||
    consensusTimeQuery.isLoading ||
    queueStatsQuery.isLoading;

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
      </Grid>
    </>
  );
};

export default Temporal;
