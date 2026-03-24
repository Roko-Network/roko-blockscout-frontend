// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Grid, Heading } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { HomeDataContextProvider } from 'src/slices/home/contexts/home-data-context';
import { HomeRpcDataContextProvider } from 'src/slices/home/contexts/rpc-data-context';

import AdBanner from 'src/features/ads/banner/components/AdBanner';
import LatestArbitrumL2Batches from 'src/features/rollup/arbitrum/pages/home/LatestArbitrumL2Batches';
import {
  fetchTemporalConsensusTime,
  fetchTemporalQueueStats,
  fetchTemporalWatermark,
} from 'src/features/temporal/api/temporal-rpc';
import TemporalConsensusCard from 'src/features/temporal/components/TemporalConsensusCard';
import TemporalQualityChart from 'src/features/temporal/components/TemporalQualityChart';
import TemporalQueueCard from 'src/features/temporal/components/TemporalQueueCard';
import TemporalWatermarkCard from 'src/features/temporal/components/TemporalWatermarkCard';

import config from 'src/config';
import useIsMobile from 'src/shared/hooks/useIsMobile';
import { SECOND } from 'src/toolkit/utils/consts';

import LatestBlocks from './blocks/LatestBlocks';
import ChainIndicators from './charts/ChainIndicators';
import HeroBanner from './HeroBanner';
import Highlights from './highlights/Highlights';
import Stats from './stats/Stats';
import Transactions from './txs/Transactions';

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
        case 'arbitrum':
          return <LatestArbitrumL2Batches/>;
      }
    }

    return <LatestBlocks/>;
  })();

  return (
    <HomeDataContextProvider>
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
            <Box mt={ 4 }>
              <TemporalQualityChart/>
            </Box>
          </Box>
          { !isMobile && config.slices.home.highlights && <Highlights mt={ 3 }/> }
          { isMobile && <AdBanner mt={ 6 } mx="auto" justifyContent="center" format="mobile"/> }
          <Flex mt={ 8 } direction={{ base: 'column', lg: 'row' }} columnGap={ 12 } rowGap={ 6 }>
            { leftWidget }
            <Box flexGrow={ 1 }>
              <Transactions/>
            </Box>
          </Flex>
        </Box>
      </HomeRpcDataContextProvider>
    </HomeDataContextProvider>
  );
};

export default Home;
