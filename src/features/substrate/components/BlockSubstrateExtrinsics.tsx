import { Box, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { route } from 'nextjs-routes';

import {
  fetchBlockExtrinsics,
  truncateHex,
} from 'src/features/substrate/api/substrate-api';
import SubstrateExtrinsicsTable from 'src/features/substrate/components/SubstrateExtrinsicsTable';
import { Link } from 'src/toolkit/chakra/link';
import { Skeleton } from 'src/toolkit/chakra/skeleton';

interface Props {
  blockNumber: number;
}

/**
 * Sprint 5 / S5-T11 — "Substrate Extrinsics" tab on block detail.
 *
 * Augments Blockscout's EVM-only "Transactions" tab with the substrate-side
 * extrinsic list (timestamp.set, temporal.setBlockTemporalBundle, im-online
 * heartbeats, staking calls, etc.) — the activity that's actually filling
 * the chain.
 *
 * Includes a one-line author badge at the top from the response envelope.
 */
const BlockSubstrateExtrinsics = ({ blockNumber }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'substrate_block_extrinsics', blockNumber ],
    queryFn: () => fetchBlockExtrinsics(blockNumber),
    enabled: Number.isFinite(blockNumber),
  });

  if (isLoading) {
    return <Skeleton loading={ true } w="100%" h="200px"/>;
  }

  if (isError) {
    return (
      <Box p={ 4 } color="text.secondary" fontSize="sm">
        Substrate indexer hasn't reached this block yet. Try again in a few seconds.
      </Box>
    );
  }

  const author = data?.author;
  const items = data?.items ?? [];

  return (
    <>
      { author && author.author_stash && (
        <Box mb={ 4 } fontSize="sm" color="text.secondary">
          <chakra.span>Authored by </chakra.span>
          <Link href={ route({ pathname: '/validators/[id]', query: { id: author.author_stash } }) }>
            <chakra.span fontFamily="mono">{ truncateHex(author.author_stash, 8, 6) }</chakra.span>
          </Link>
          <chakra.span>{ ' ' }(auth { author.author_index }{ author.slot !== null ? `, slot ${ author.slot }` : '' })</chakra.span>
        </Box>
      ) }
      <SubstrateExtrinsicsTable items={ items } hideBlockColumn/>
    </>
  );
};

export default BlockSubstrateExtrinsics;
