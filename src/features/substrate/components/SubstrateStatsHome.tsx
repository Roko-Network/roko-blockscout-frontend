import { Box, Flex, Grid, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { route } from 'nextjs-routes';

import {
  fetchSubstrateEras,
  fetchSubstrateValidators,
  fetchRecentSlashes,
  formatRoko,
} from 'src/features/substrate/api/substrate-api';
import { Link } from 'src/toolkit/chakra/link';
import { Skeleton } from 'src/toolkit/chakra/skeleton';
import { SECOND } from 'src/toolkit/utils/consts';

const REFETCH_INTERVAL_MS = 30 * SECOND;

interface MetricProps {
  label: string;
  value: React.ReactNode;
  isLoading: boolean;
  href?: string;
}

const Metric = ({ label, value, isLoading, href }: MetricProps) => {
  const body = (
    <Flex direction="column" minW="0" flex="1">
      <chakra.span
        display="block"
        textStyle="xs"
        color="text.secondary"
        fontWeight={ 500 }
        textTransform="uppercase"
        letterSpacing="wide"
      >
        { label }
      </chakra.span>
      <Skeleton loading={ isLoading } w="fit-content" mt={ 0.5 }>
        <chakra.span display="block" textStyle="lg" fontWeight={ 700 }>
          { value }
        </chakra.span>
      </Skeleton>
    </Flex>
  );

  return href ? <Link href={ href } _hover={{ textDecoration: 'none' }}>{ body }</Link> : body;
};

/**
 * Sprint 4 / S4-T5 — homepage card surfacing substrate-native state
 * (validator count, current era, recent slashing activity). Sits next to
 * the existing Temporal cards.
 *
 * The slashes-in-24h figure is approximated by the size of the recent-
 * slashing feed; this is a fast read-only summary, not a precise count.
 */
const SubstrateStatsHome = () => {
  const validatorsQuery = useQuery({
    queryKey: [ 'substrate_validators' ],
    queryFn: fetchSubstrateValidators,
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: 0,
  });

  const erasQuery = useQuery({
    queryKey: [ 'substrate_eras_home' ],
    queryFn: () => fetchSubstrateEras(1),
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: 0,
  });

  const slashesQuery = useQuery({
    queryKey: [ 'substrate_slashes_home' ],
    queryFn: () => fetchRecentSlashes(50),
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: 0,
  });

  const validatorCount = validatorsQuery.data?.items?.length ?? 0;
  const currentEra = erasQuery.data?.items?.[0];
  const recentSlashes = slashesQuery.data?.items ?? [];
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  const slashes24h = recentSlashes.filter((s) => {
    if (!s.recorded_at) return false;
    const t = Date.parse(s.recorded_at);
    return Number.isFinite(t) && t >= cutoff;
  }).length;

  const isLoading =
    validatorsQuery.isLoading || erasQuery.isLoading || slashesQuery.isLoading;

  // If every sub-source failed, render the card with em-dashes rather than
  // disappearing — the operator can still tell the substrate side is offline.
  return (
    <Box
      borderWidth="1px"
      borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
      borderRadius="xl"
      p={ 5 }
    >
      <Flex alignItems="center" gap={ 2 } mb={ 4 }>
        <Box w="3px" h="20px" bg="green.400" borderRadius="full"/>
        <chakra.h3 fontSize="md" fontWeight={ 700 }>Validators &amp; Staking</chakra.h3>
      </Flex>
      <Grid templateColumns={{ base: '1fr 1fr', lg: 'repeat(3, 1fr)' }} gap={ 4 }>
        <Metric
          label="Active validators"
          value={ validatorsQuery.isError ? '—' : validatorCount }
          isLoading={ isLoading }
          href={ route({ pathname: '/validators' }) }
        />
        <Metric
          label="Current era"
          value={ currentEra ? (
            <>
              #{ currentEra.era_index }
              <chakra.span fontSize="xs" color="text.secondary" ml={ 2 }>
                { formatRoko(currentEra.validator_payout) } ROKO payout
              </chakra.span>
            </>
          ) : '—' }
          isLoading={ isLoading }
          href={ currentEra ? route({
            pathname: '/staking/eras/[n]',
            query: { n: String(currentEra.era_index) },
          }) : undefined }
        />
        <Metric
          label="Slashes (24h)"
          value={ (
            <chakra.span color={ slashes24h > 0 ? 'red.500' : undefined }>
              { slashesQuery.isError ? '—' : slashes24h }
            </chakra.span>
          ) }
          isLoading={ isLoading }
          href={ route({ pathname: '/staking/eras' }) }
        />
      </Grid>
    </Box>
  );
};

export default SubstrateStatsHome;
