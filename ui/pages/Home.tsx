import { Box, Flex, Grid, Heading, Text } from '@chakra-ui/react';
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
import Highlights from 'ui/home/Highlights';
import ChainIndicators from 'ui/home/indicators/ChainIndicators';
import LatestArbitrumL2Batches from 'ui/home/latestBatches/LatestArbitrumL2Batches';
import LatestZkEvmL2Batches from 'ui/home/latestBatches/LatestZkEvmL2Batches';
import LatestBlocks from 'ui/home/LatestBlocks';
import Stats from 'ui/home/Stats';
import TemporalConsensusCard from 'ui/temporal/TemporalConsensusCard';
import TemporalQualityChart from 'ui/temporal/TemporalQualityChart';
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
        <Box bg="#1A202C" py={ 8 } px={ 6 } borderRadius="xl" mb={ 4 }>
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
              {/* Live mesh quality indicator */}
              <Box textAlign="center">
                <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                  Mesh Quality
                </Text>
                <Text color="white" fontSize="2xl" fontFamily="heading" fontWeight={ 700 }>
                  {consensusTimeQuery.data?.quality_percent ?? '—'}%
                </Text>
              </Box>
              <Box textAlign="center">
                <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                  Validators
                </Text>
                <Text color="white" fontSize="2xl" fontFamily="heading" fontWeight={ 700 }>
                  {consensusTimeQuery.data?.validator_count ?? '—'}
                </Text>
              </Box>
              <Box textAlign="center">
                <Text color="whiteAlpha.600" fontSize="xs" textTransform="uppercase" letterSpacing="wider">
                  Convergence
                </Text>
                <Flex alignItems="center" gap={ 1 } justifyContent="center">
                  <Box w={ 2 } h={ 2 } borderRadius="full" bg={consensusTimeQuery.data?.is_converged ? 'green.400' : 'orange.400'}/>
                  <Text color="white" fontSize="md" fontFamily="heading">
                    {consensusTimeQuery.data?.is_converged ? 'Converged' : 'Syncing'}
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
            <Box w="3px" h="24px" bg="#0078D4" borderRadius="full"/>
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
