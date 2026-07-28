import { Box, Flex, Grid, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { route } from 'nextjs-routes';

import { fetchSubstrateStats, truncateHex } from 'lib/api/services/general/substrateApi';
import { Link } from 'toolkit/chakra/link';
import { Skeleton } from 'toolkit/chakra/skeleton';
import { SECOND } from 'toolkit/utils/consts';

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
 * Sprint 5 / S5-T15 — homepage card surfacing substrate-side activity that
 * Blockscout's EVM-only `/api/v2/stats` doesn't see (extrinsic counts, top
 * pallet:method, top author). Sits next to the temporal + Validators &
 * Staking cards.
 */
const SubstrateActivityHome = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'substrate_stats' ],
    queryFn: fetchSubstrateStats,
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: 0,
  });

  const topPallet = data?.top_pallets_24h?.[0];
  const topAuthor = data?.block_authors_24h?.[0];

  return (
    <Box
      borderWidth="2px"
      borderColor="border.divider"
      borderRadius="base"
      bg="bg.elevated"
      p={ 5 }
    >
      <Flex alignItems="center" gap={ 2 } mb={ 4 }>
        <Box w="2px" h="20px" bg="brand.accent" borderRadius="sm"/>
        <chakra.h3 fontFamily="heading" fontSize="md" fontWeight={ 700 }>Substrate activity (24h)</chakra.h3>
      </Flex>
      <Grid templateColumns={{ base: '1fr 1fr', lg: 'repeat(4, 1fr)' }} gap={ 4 }>
        <Metric
          label="Total extrinsics"
          value={ isError ? '—' : (data?.total_extrinsics ?? 0).toLocaleString() }
          isLoading={ isLoading }
        />
        <Metric
          label="Signed (24h)"
          value={ isError ? '—' : (data?.signed_extrinsics_24h ?? 0).toLocaleString() }
          isLoading={ isLoading }
        />
        <Metric
          label="Top pallet.method"
          value={ topPallet ? (
            <>
              <chakra.span fontFamily="mono">{ topPallet.pallet }.{ topPallet.method }</chakra.span>
              <chakra.span fontSize="xs" color="text.secondary" ml={ 2 }>
                { topPallet.count.toLocaleString() }
              </chakra.span>
            </>
          ) : '—' }
          isLoading={ isLoading }
        />
        <Metric
          label="Top author"
          value={ topAuthor && topAuthor.author_stash ? (
            <>
              <chakra.span fontFamily="mono">{ truncateHex(topAuthor.author_stash, 6, 4) }</chakra.span>
              <chakra.span fontSize="xs" color="text.secondary" ml={ 2 }>
                { topAuthor.blocks.toLocaleString() }
              </chakra.span>
            </>
          ) : '—' }
          isLoading={ isLoading }
          href={ topAuthor?.author_stash ?
            route({ pathname: '/validators/[id]', query: { id: topAuthor.author_stash } }) :
            undefined }
        />
      </Grid>
    </Box>
  );
};

export default SubstrateActivityHome;
