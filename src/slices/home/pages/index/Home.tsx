// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Grid, Heading, Text } from '@chakra-ui/react';
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
          <Box bg="blackAlpha.900" py={ 8 } px={ 6 } borderRadius="xl" mb={ 4 }>
            <Flex direction={{ base: 'column', lg: 'row' }} justifyContent="space-between" alignItems="center" gap={ 6 }>
              <Box>
                <Heading as="h1" fontSize={{ base: '2xl', lg: '3xl' }} fontFamily="heading" color="white" mb={ 2 }>
                  Roko Network Explorer
                </Heading>
                <Text color="whiteAlpha.700" fontSize="md">
                  The Temporal Layer for Web3 — Nanosecond-Precision Transaction Ordering
                </Text>
              </Box>
              <Flex gap={ 6 } alignItems="center">
                <Box textAlign="center">
                  <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                    Mesh Quality
                  </Text>
                  <Text color="white" fontSize="2xl" fontFamily="heading" fontWeight={ 700 }>
                    { consensusTimeQuery.data?.quality_percent ?? '—' }%
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                    Validators
                  </Text>
                  <Text color="white" fontSize="2xl" fontFamily="heading" fontWeight={ 700 }>
                    { consensusTimeQuery.data?.validator_count ?? '—' }
                  </Text>
                </Box>
                <Box textAlign="center">
                  <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                    Convergence
                  </Text>
                  <Flex alignItems="center" gap={ 1 } justifyContent="center">
                    <Box
                      w={ 2 }
                      h={ 2 }
                      borderRadius="full"
                      bg={ consensusTimeQuery.data?.is_converged ? 'green.400' : 'orange.400' }
                    />
                    <Text color="white" fontSize="md" fontFamily="heading">
                      { consensusTimeQuery.data?.is_converged ? 'Converged' : 'Syncing' }
                    </Text>
                  </Flex>
                </Box>
              </Flex>
            </Flex>
          </Box>
          <Flex flexDir={{ base: 'column', lg: 'row' }} columnGap={ 2 } rowGap={ 1 } mt={ 3 } _empty={{ mt: 0 }}>
            <Stats/>
            <ChainIndicators/>
          </Flex>
          <Box mt={ 6 }>
            <Flex alignItems="center" gap={ 2 } mb={ 3 }>
              <Box w="3px" h="24px" bg="link.primary" borderRadius="full"/>
              <Heading as="h2" fontSize="lg" fontFamily="heading" letterSpacing="wide">
                Temporal Ordering
              </Heading>
            </Flex>
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
