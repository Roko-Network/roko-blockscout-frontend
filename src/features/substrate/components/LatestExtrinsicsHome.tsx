// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Text } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { route } from 'nextjs-routes';
import React from 'react';

import { fetchRecentExtrinsics } from 'src/features/substrate/api/substrate-api';

import useIsMobile from 'src/shared/hooks/useIsMobile';

import { Link } from 'src/toolkit/chakra/link';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

import SubstrateExtrinsicsTable from './SubstrateExtrinsicsTable';

// Sprint 5 — home-page widget mirroring `LatestTxs.tsx` for the substrate
// side. Cap at 5 rows on desktop, 3 on mobile, with a "View all" link to
// the full `/extrinsics` feed.
const LatestExtrinsicsHome = () => {
  const isMobile = useIsMobile();
  const count = isMobile ? 3 : 5;

  const query = useQuery({
    queryKey: [ 'home_latest_extrinsics', count ],
    queryFn: () => fetchRecentExtrinsics({ limit: count }),
    refetchInterval: 12_000,
  });

  if (query.isLoading) {
    return <Skeleton loading={ true } w="100%" h="200px"/>;
  }

  if (query.isError) {
    return (
      <Box p={ 3 } fontSize="sm" color="text.secondary">
        Substrate indexer unreachable.
      </Box>
    );
  }

  const items = query.data?.items ?? [];
  const url = route({ pathname: '/extrinsics' });

  if (items.length === 0) {
    return <Text fontSize="sm" color="text.secondary">No recent extrinsics.</Text>;
  }

  return (
    <>
      <Box mb={ 3 } textStyle="sm">
        <SubstrateExtrinsicsTable items={ items }/>
      </Box>
      <Flex justifyContent="center">
        <Link textStyle="sm" href={ url }>View all extrinsics</Link>
      </Flex>
    </>
  );
};

export default LatestExtrinsicsHome;
