// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { fetchBlockEvents } from 'src/features/substrate/api/substrate-api';
import SubstrateEventsTable from 'src/features/substrate/components/SubstrateEventsTable';

import { Skeleton } from 'src/toolkit/chakra/skeleton';

interface Props {
  blockNumber: number;
}

/**
 * Sprint 5 / S5-T12 — "Events" tab on block detail.
 *
 * Lists every event in the block (Initialization, ApplyExtrinsic phase,
 * Finalization) with phase badges so non-extrinsic activity (era rollovers,
 * code updates) is visible.
 */
const BlockSubstrateEvents = ({ blockNumber }: Props) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'substrate_block_events', blockNumber ],
    queryFn: () => fetchBlockEvents(blockNumber),
    enabled: Number.isFinite(blockNumber),
  });

  if (isLoading) return <Skeleton loading={ true } w="100%" h="200px"/>;
  if (isError) return <Box p={ 4 } color="text.secondary">Substrate indexer hasn't reached this block yet.</Box>;

  return <SubstrateEventsTable items={ data?.items ?? [] }/>;
};

export default BlockSubstrateEvents;
