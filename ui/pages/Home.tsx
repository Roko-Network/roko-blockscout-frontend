import { Box, Flex, Grid, Heading } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import config from 'configs/app';
import {
  fetchTemporalConsensusTime,
  fetchTemporalQueueStats,
  fetchTemporalWatermark,
} from 'lib/api/services/general/temporalRpc';
import useIsMobile from 'lib/hooks/useIsMobile';
import { SECOND } from 'toolkit/utils/consts';
import { HomeRpcDataContextProvider } from 'ui/home/fallbacks/rpcDataContext';
import HeroBanner from 'ui/home/HeroBanner';
import Highlights from 'ui/home/Highlights';
import ChainIndicators from 'ui/home/indicators/ChainIndicators';
import LatestArbitrumL2Batches from 'ui/home/latestBatches/LatestArbitrumL2Batches';
import LatestZkEvmL2Batches from 'ui/home/latestBatches/LatestZkEvmL2Batches';
import LatestBlocks from 'ui/home/LatestBlocks';
import Stats from 'ui/home/Stats';
import TemporalConsensusCard from 'ui/temporal/TemporalConsensusCard';
import TemporalQueueCard from 'ui/temporal/TemporalQueueCard';
import TemporalWatermarkCard from 'ui/temporal/TemporalWatermarkCard';
import Transactions from 'ui/home/Transactions';
import AdBanner from 'ui/shared/ad/AdBanner';

const rollupFeature = config.features.rollup;

const BLOCK_TIME_MS = 6 * SECOND;

const Home = () => {
  const isMobile = useIsMobile();

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

  const temporalLoading =
    watermarkQuery.isLoading ||
    consensusTimeQuery.isLoading ||
    queueStatsQuery.isLoading;

  const leftWidget = (() => {
    if (rollupFeature.isEnabled && !rollupFeature.homepage.showLatestBlocks) {
      switch (rollupFeature.type) {
        case 'zkEvm':
          return <LatestZkEvmL2Batches/>;
        case 'arbitrum':
          return <LatestArbitrumL2Batches/>;
      }
    }

    return <LatestBlocks/>;
  })();

  return (
    <HomeRpcDataContextProvider>
      <Box as="main">
        <HeroBanner/>
        <Flex flexDir={{ base: 'column', lg: 'row' }} columnGap={ 2 } rowGap={ 1 } mt={ 3 } _empty={{ mt: 0 }}>
          <Stats/>
          <ChainIndicators/>
        </Flex>
        <Box mt={ 6 }>
          <Heading as="h2" fontSize="lg" fontFamily="heading" mb={ 3 }>
            Temporal Ordering
          </Heading>
          <Grid
            templateColumns={{ base: '1fr', lg: 'repeat(3, 1fr)' }}
            gap={ 6 }
          >
            <TemporalWatermarkCard
              data={ watermarkQuery.data }
              isLoading={ temporalLoading }
            />
            <TemporalConsensusCard
              data={ consensusTimeQuery.data }
              isLoading={ temporalLoading }
            />
            <TemporalQueueCard
              data={ queueStatsQuery.data }
              isLoading={ temporalLoading }
            />
          </Grid>
        </Box>
        { !isMobile && config.UI.homepage.highlights && <Highlights mt={ 3 }/> }
        { isMobile && <AdBanner mt={ 6 } mx="auto" justifyContent="center" format="mobile"/> }
        <Flex mt={ 8 } direction={{ base: 'column', lg: 'row' }} columnGap={ 12 } rowGap={ 6 }>
          { leftWidget }
          <Box flexGrow={ 1 }>
            <Transactions/>
          </Box>
        </Flex>
      </Box>
    </HomeRpcDataContextProvider>
  );
};

export default Home;
