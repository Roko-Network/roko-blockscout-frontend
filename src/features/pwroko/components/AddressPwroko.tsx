import { Box, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { route } from 'nextjs-routes';

import type { SubstratePwrokoEvent } from 'src/features/substrate/api/substrate-api';
import { fetchAccountPwrokoHistory, formatRoko, truncateHex } from 'src/features/substrate/api/substrate-api';
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
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'substrate_account_pwroko_history', addressHash.toLowerCase() ],
    queryFn: () => fetchAccountPwrokoHistory(addressHash),
    enabled: Boolean(addressHash),
  });

  if (isLoading) {
    return <Skeleton loading={ true } w="100%" h="120px"/>;
  }

  if (isError) {
    return <Box p={ 4 } color="red.500">Failed to load pwROKO history.</Box>;
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return <Box p={ 4 } color="text.secondary" fontSize="sm">No pwROKO events for this address.</Box>;
  }

  const me = addressHash.toLowerCase();

  return (
    <TableRoot variant="line">
      <TableHeader>
        <TableRow>
          <TableColumnHeader>Block</TableColumnHeader>
          <TableColumnHeader>Event</TableColumnHeader>
          <TableColumnHeader>Amount</TableColumnHeader>
          <TableColumnHeader>Backing</TableColumnHeader>
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
    </TableRoot>
  );
};

export default AddressPwroko;
