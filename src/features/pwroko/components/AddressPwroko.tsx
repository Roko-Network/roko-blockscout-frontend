// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Text, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { route } from 'nextjs-routes';
import React from 'react';

import PwRokoIcon from 'src/features/pwroko/components/PwRokoIcon';
import type { SubstratePwrokoEvent } from 'src/features/substrate/api/substrate-api';
import { fetchAccountPwrokoHistory, formatRoko, truncateHex } from 'src/features/substrate/api/substrate-api';

import { Button } from 'src/toolkit/chakra/button';
import { Link } from 'src/toolkit/chakra/link';
import { Skeleton } from 'src/toolkit/chakra/skeleton';
import { TableRoot, TableHeader, TableBody, TableRow, TableColumnHeader, TableCell } from 'src/toolkit/chakra/table';

interface Props {
  addressHash: string;
}

/**
 * Sprint 4 / S4-T3 — pwROKO tab on the address detail page.
 *
 * Mounts when the address has ≥1 pwROKO event (see `useAddressHasPwrokoHistory`
 * helper used by `Address.tsx` to gate inclusion of this tab).
 */
const AddressPwroko = ({ addressHash }: Props) => {
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: [ 'substrate_account_pwroko_history', addressHash.toLowerCase() ],
    queryFn: () => fetchAccountPwrokoHistory(addressHash, 100),
    enabled: Boolean(addressHash),
  });

  const handleRetry = React.useCallback(() => {
    refetch();
  }, [ refetch ]);

  if (isLoading) {
    return <Skeleton loading={ true } w="100%" h="120px"/>;
  }

  if (isError) {
    return (
      <Box p={ 5 } borderWidth="1px" borderRadius="lg" role="status">
        <Text fontWeight="semibold">pwROKO history is temporarily unavailable</Text>
        <Text color="text.secondary" mt={ 2 }>This does not mean the balance is zero or activity is missing from the chain.</Text>
        <Button mt={ 3 } onClick={ handleRetry } loading={ isFetching }>Try again</Button>
      </Box>
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <Box p={ 5 } borderWidth="1px" borderRadius="lg">
        <Text fontWeight="semibold">No pwROKO activity found in this view</Text>
        <Text mt={ 2 } color="text.secondary" fontSize="sm">
          Lock and unlock events will appear here when indexed. For current staking state, check the validator or staking view.
        </Text>
      </Box>
    );
  }

  const me = addressHash.toLowerCase();

  return (
    <Box overflowX="auto"><TableRoot variant="line">
      <TableHeader>
        <TableRow>
          <TableColumnHeader>Block</TableColumnHeader>
          <TableColumnHeader>Action</TableColumnHeader>
          <TableColumnHeader>
            <chakra.span display="inline-flex" alignItems="center" gap={ 1.5 }>
              <PwRokoIcon boxSize={ 5 }/>
              Amount (pwROKO)
            </chakra.span>
          </TableColumnHeader>
          <TableColumnHeader>Native backing (ROKO)</TableColumnHeader>
          <TableColumnHeader>Counterparty</TableColumnHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        { items.map((row: SubstratePwrokoEvent) => {
          const from = (row.from_account ?? '').toLowerCase();
          const counterparty = from === me ? row.to_account : row.from_account;
          return (
            <TableRow key={ row.id }>
              <TableCell fontFamily="mono">
                <Link href={ route({ pathname: '/block/[height_or_hash]', query: { height_or_hash: String(row.block_number) } }) }>
                  { row.block_number.toLocaleString() }
                </Link>
              </TableCell>
              <TableCell>{ row.event_kind }</TableCell>
              <TableCell fontFamily="mono">{ formatRoko(row.amount) }</TableCell>
              <TableCell fontFamily="mono">{ formatRoko(row.backing_amount) }</TableCell>
              <TableCell fontFamily="mono">
                { counterparty ? (
                  <Link href={ route({ pathname: '/address/[hash]', query: { hash: counterparty } }) }>
                    { truncateHex(counterparty, 6, 4) }
                  </Link>
                ) : (
                  <chakra.span color="text.secondary">—</chakra.span>
                ) }
              </TableCell>
            </TableRow>
          );
        }) }
      </TableBody>
    </TableRoot></Box>
  );
};

export default AddressPwroko;
