import { Grid, Text } from '@chakra-ui/react';
import React from 'react';

import useApiQuery from 'src/api/hooks/useApiQuery';
import PageTitle from 'src/shell/page/title/PageTitle';

import TemporalConsensusCard from 'src/features/temporal/components/TemporalConsensusCard';
import TemporalQueueCard from 'src/features/temporal/components/TemporalQueueCard';
import TemporalWatermarkCard from 'src/features/temporal/components/TemporalWatermarkCard';
import { TEMPORAL_CONSENSUS_TIME, TEMPORAL_QUEUE_STATS, TEMPORAL_WATERMARK } from 'src/features/temporal/stubs';

import { SECOND } from 'src/toolkit/utils/consts';

const BLOCK_TIME_MS = 6 * SECOND;

const Temporal = () => {
  const watermarkQuery = useApiQuery('core:temporal_watermark', {
    queryOptions: {
      placeholderData: TEMPORAL_WATERMARK,
      refetchInterval: BLOCK_TIME_MS,
      refetchOnMount: true,
    },
  });

  const consensusTimeQuery = useApiQuery('core:temporal_consensus_time', {
    queryOptions: {
      placeholderData: TEMPORAL_CONSENSUS_TIME,
      refetchInterval: BLOCK_TIME_MS,
      refetchOnMount: true,
    },
  });

  const queueStatsQuery = useApiQuery('core:temporal_queue_stats', {
    queryOptions: {
      placeholderData: TEMPORAL_QUEUE_STATS,
      refetchInterval: BLOCK_TIME_MS,
      refetchOnMount: true,
    },
  });

  const isLoading =
    watermarkQuery.isPlaceholderData ||
    consensusTimeQuery.isPlaceholderData ||
    queueStatsQuery.isPlaceholderData;

  return (
    <>
      <PageTitle
        title="Temporal Dashboard"
        secondRow={ (
          <Text fontSize="sm" color="text.secondary">
            Nanosecond-precision temporal ordering — auto-refreshes every 6 seconds
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
