// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Text, chakra } from '@chakra-ui/react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import React from 'react';

import PageTitle from 'src/shell/page/title/PageTitle';

import type {
  SubstrateExtrinsic,
  SubstrateExtrinsicCursor,
} from 'src/features/substrate/api/substrate-api';
import {
  fetchRecentExtrinsics,
  fetchSubstrateStats,
} from 'src/features/substrate/api/substrate-api';
import SubstrateExtrinsicsTable from 'src/features/substrate/components/SubstrateExtrinsicsTable';

import { Button } from 'src/toolkit/chakra/button';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

const PAGE_SIZE = 50;

const Extrinsics = () => {
  const statsQuery = useQuery({
    queryKey: [ 'substrate_extrinsics_stats' ],
    queryFn: () => fetchSubstrateStats(),
  });

  const query = useInfiniteQuery({
    queryKey: [ 'substrate_extrinsics_recent' ],
    queryFn: ({ pageParam }) =>
      fetchRecentExtrinsics({ limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: null as SubstrateExtrinsicCursor | null,
    getNextPageParam: (lastPage) => lastPage.next_page_params ?? undefined,
  });

  const items: Array<SubstrateExtrinsic> = React.useMemo(() => {
    return query.data?.pages.flatMap((p) => p.items) ?? [];
  }, [ query.data ]);

  const handleLoadMore = React.useCallback(() => {
    query.fetchNextPage();
  }, [ query ]);

  const stats = statsQuery.data;

  return (
    <>
      <PageTitle title="Extrinsics" withTextAd/>

      { stats && (
        <Flex gap={ 6 } mb={ 4 } fontSize="sm" color="text.secondary" wrap="wrap">
          <Box>
            <chakra.span>Latest block </chakra.span>
            <chakra.span fontWeight={ 600 } color="text.primary" fontFamily="mono">
              { stats.latest_block.toLocaleString() }
            </chakra.span>
          </Box>
          <Box>
            <chakra.span>Avg/block </chakra.span>
            <chakra.span fontWeight={ 600 } color="text.primary" fontFamily="mono">
              { stats.avg_extrinsics_per_block.toFixed(1) }
            </chakra.span>
          </Box>
          <Box>
            <chakra.span>Authors 24h </chakra.span>
            <chakra.span fontWeight={ 600 } color="text.primary" fontFamily="mono">
              { stats.block_authors_24h.length }
            </chakra.span>
          </Box>
        </Flex>
      ) }

      { query.isLoading && <Skeleton loading={ true } w="100%" h="400px"/> }

      { query.isError && (
        <Box p={ 4 } color="red.500" fontSize="sm">
          Failed to load extrinsics. The substrate indexer may be catching up — try again in a few seconds.
        </Box>
      ) }

      { !query.isLoading && !query.isError && (
        <>
          <SubstrateExtrinsicsTable items={ items }/>
          <Flex justify="center" mt={ 4 } mb={ 6 }>
            { query.hasNextPage && (
              <Button
                onClick={ handleLoadMore }
                disabled={ query.isFetchingNextPage }
                loading={ query.isFetchingNextPage }
                variant="outline"
              >
                Load more
              </Button>
            ) }
            { !query.hasNextPage && items.length > 0 && (
              <Text fontSize="sm" color="text.secondary">End of feed.</Text>
            ) }
          </Flex>
        </>
      ) }
    </>
  );
};

export default Extrinsics;
