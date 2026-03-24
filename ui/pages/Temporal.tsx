import { Grid, Text } from '@chakra-ui/react';
import React from 'react';

import useApiQuery from 'lib/api/useApiQuery';
import { TEMPORAL_CONSENSUS_TIME, TEMPORAL_QUEUE_STATS, TEMPORAL_WATERMARK } from 'stubs/temporal';
import { SECOND } from 'toolkit/utils/consts';
import PageTitle from 'ui/shared/Page/PageTitle';
import TemporalConsensusCard from 'ui/temporal/TemporalConsensusCard';
import TemporalQueueCard from 'ui/temporal/TemporalQueueCard';
import TemporalWatermarkCard from 'ui/temporal/TemporalWatermarkCard';

const BLOCK_TIME_MS = 6 * SECOND;

const Temporal = () => {
  const watermarkQuery = useApiQuery('general:temporal_watermark', {
    queryOptions: {
      placeholderData: TEMPORAL_WATERMARK,
      refetchInterval: BLOCK_TIME_MS,
      refetchOnMount: true,
    },
  });

  const consensusTimeQuery = useApiQuery('general:temporal_consensus_time', {
    queryOptions: {
      placeholderData: TEMPORAL_CONSENSUS_TIME,
      refetchInterval: BLOCK_TIME_MS,
      refetchOnMount: true,
    },
  });

  const queueStatsQuery = useApiQuery('general:temporal_queue_stats', {
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
