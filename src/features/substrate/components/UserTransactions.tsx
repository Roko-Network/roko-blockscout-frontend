// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, Text, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { route } from 'nextjs-routes';
import React from 'react';

import useApiQuery from 'src/api/hooks/useApiQuery';

import { fetchRecentExtrinsics, formatRoko, truncateHex } from 'src/features/substrate/api/substrate-api';

import { Badge } from 'src/toolkit/chakra/badge';
import { Link } from 'src/toolkit/chakra/link';
import { Skeleton } from 'src/toolkit/chakra/skeleton';
import { TableBody, TableCell, TableColumnHeader, TableHeader, TableRoot, TableRow } from 'src/toolkit/chakra/table';

import { mergeUserTransactions } from './user-transactions';
import type { UserTransactionActivity } from './user-transactions';

interface Props {
  limit?: number;
  showSummary?: boolean;
  showViewAll?: boolean;
}

function ActivityLink({ activity }: { activity: UserTransactionActivity }) {
  if (activity.kind === 'evm') {
    return (
      <Link href={ route({ pathname: '/tx/[hash]', query: { hash: activity.tx.hash } }) }>
        { truncateHex(activity.tx.hash, 8, 6) }
      </Link>
    );
  }

  const { extrinsic } = activity;
  return (
    <Link
      href={ route({
        pathname: '/extrinsic/[block]/[index]',
        query: { block: String(extrinsic.block_number), index: String(extrinsic.index_in_block) },
      }) }
    >
      { extrinsic.hash ? truncateHex(extrinsic.hash, 8, 6) : `${ extrinsic.block_number }-${ extrinsic.index_in_block }` }
    </Link>
  );
}

function UserTransactionsTable({ items }: { items: Array<UserTransactionActivity> }) {
  return (
    <Box overflowX="auto">
      <TableRoot minWidth="850px" variant="line">
        <TableHeader>
          <TableRow>
            <TableColumnHeader>Type</TableColumnHeader>
            <TableColumnHeader>Transaction</TableColumnHeader>
            <TableColumnHeader>Action</TableColumnHeader>
            <TableColumnHeader>Block</TableColumnHeader>
            <TableColumnHeader>From / signer</TableColumnHeader>
            <TableColumnHeader>Result</TableColumnHeader>
            <TableColumnHeader isNumeric>Value / fee</TableColumnHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          { items.map((activity) => {
            const isEvm = activity.kind === 'evm';
            const blockNumber = isEvm ? activity.tx.block_number : activity.extrinsic.block_number;
            const actor = isEvm ? activity.tx.from.hash : activity.extrinsic.signer;
            const succeeded = isEvm ? activity.tx.status !== 'error' : activity.extrinsic.success;
            const action = isEvm ?
              (activity.tx.method || (activity.tx.to ? 'Transfer' : 'Contract creation')) :
              `${ activity.extrinsic.pallet }.${ activity.extrinsic.method }`;
            const amount = isEvm ? activity.tx.value : activity.extrinsic.fee_paid;
            const key = isEvm ?
              `evm-${ activity.tx.hash }` :
              `substrate-${ activity.extrinsic.block_number }-${ activity.extrinsic.index_in_block }`;

            return (
              <TableRow key={ key }>
                <TableCell>
                  <Badge colorPalette={ isEvm ? 'blue' : 'purple' }>
                    { isEvm ? 'EVM' : 'ROKO' }
                  </Badge>
                </TableCell>
                <TableCell fontFamily="mono"><ActivityLink activity={ activity }/></TableCell>
                <TableCell fontFamily="mono">{ action }</TableCell>
                <TableCell fontFamily="mono">
                  { blockNumber !== null ? (
                    <Link href={ route({ pathname: '/block/[height_or_hash]', query: { height_or_hash: String(blockNumber) } }) }>
                      { blockNumber.toLocaleString() }
                    </Link>
                  ) : 'Pending' }
                </TableCell>
                <TableCell fontFamily="mono">
                  { actor ? (
                    <Link href={ route({ pathname: '/address/[hash]', query: { hash: actor } }) }>
                      { truncateHex(actor, 8, 6) }
                    </Link>
                  ) : '—' }
                </TableCell>
                <TableCell>
                  <chakra.span color={ succeeded ? 'green.500' : 'red.500' } fontWeight={ 600 }>
                    { succeeded ? 'Success' : 'Failed' }
                  </chakra.span>
                </TableCell>
                <TableCell isNumeric fontFamily="mono">
                  { amount ? `${ formatRoko(amount) } ROKO` : '—' }
                </TableCell>
              </TableRow>
            );
          }) }
        </TableBody>
      </TableRoot>
    </Box>
  );
}

const UserTransactions = ({ limit = 50, showSummary = false, showViewAll = false }: Props) => {
  const evmQuery = useApiQuery('core:txs', {
    queryParams: { filter: 'validated' },
    queryOptions: { refetchInterval: 12_000 },
  });
  const substrateQuery = useQuery({
    queryKey: [ 'user_transactions_substrate_signed', limit ],
    queryFn: () => fetchRecentExtrinsics({ extrinsicClass: 'Signed', limit }),
    refetchInterval: 12_000,
  });

  const items = React.useMemo(() => mergeUserTransactions(
    evmQuery.data?.items ?? [],
    substrateQuery.data?.items ?? [],
  ).slice(0, limit), [ evmQuery.data, substrateQuery.data, limit ]);

  const isLoading = evmQuery.isLoading || substrateQuery.isLoading;
  const hasError = evmQuery.isError || substrateQuery.isError;
  const isComplete = evmQuery.data?.next_page_params === null && substrateQuery.data?.next_page_params === null;

  if (isLoading && items.length === 0) {
    return <Skeleton loading={ true } w="100%" h="240px"/>;
  }

  if (items.length === 0 && hasError) {
    return <Box p={ 4 } color="red.500" fontSize="sm">Unable to load user transactions.</Box>;
  }

  return (
    <>
      { showSummary && (
        <Flex justify="space-between" align="center" mb={ 3 } gap={ 4 } wrap="wrap">
          <Text fontSize="sm" color="text.secondary">
            { isComplete ?
              `${ items.length.toLocaleString() } user transaction${ items.length === 1 ? '' : 's' }` :
              `Showing ${ items.length.toLocaleString() } latest user transactions` }
          </Text>
          <Text fontSize="xs" color="text.secondary">EVM transactions + signed ROKO extrinsics</Text>
        </Flex>
      ) }
      { hasError && items.length > 0 && (
        <Box mb={ 3 } color="orange.500" fontSize="sm">
          One transaction source is temporarily unavailable; showing partial results.
        </Box>
      ) }
      { items.length > 0 ? <UserTransactionsTable items={ items }/> :
        <Text fontSize="sm" color="text.secondary">No user transactions found.</Text> }
      { showViewAll && (
        <Flex justifyContent="center" mt={ 3 }>
          <Link textStyle="sm" href={ route({ pathname: '/txs' }) }>View all transactions</Link>
        </Flex>
      ) }
    </>
  );
};

export default UserTransactions;
