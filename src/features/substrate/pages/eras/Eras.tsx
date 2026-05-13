import { Box, Flex, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { route } from 'nextjs-routes';

import { fetchSubstrateEras, formatRoko } from 'src/features/substrate/api/substrate-api';
import type { SubstrateEra } from 'src/features/substrate/api/substrate-api';
import PageTitle from 'src/shell/page/title/PageTitle';
import { Link } from 'src/toolkit/chakra/link';
import { Skeleton } from 'src/toolkit/chakra/skeleton';
import { TableRoot, TableHeader, TableBody, TableRow, TableColumnHeader, TableCell } from 'src/toolkit/chakra/table';
import { SECOND } from 'src/toolkit/utils/consts';

const REFETCH_INTERVAL_MS = 30 * SECOND;

function EraRow({ era }: { era: SubstrateEra }) {
  const href = route({ pathname: '/staking/eras/[n]', query: { n: String(era.era_index) } });
  const hasSlashes = (era.slashed_count ?? 0) > 0;
  return (
    <TableRow bg={ hasSlashes ? 'red.50' : undefined } _dark={ hasSlashes ? { bg: 'red.900/30' } : undefined }>
      <TableCell fontFamily="mono">
        <Link href={ href }>{ era.era_index }</Link>
      </TableCell>
      <TableCell fontFamily="mono">{ era.start_block?.toLocaleString() ?? '—' }</TableCell>
      <TableCell fontFamily="mono">{ era.end_block?.toLocaleString() ?? '—' }</TableCell>
      <TableCell fontFamily="mono">{ formatRoko(era.validator_payout) }</TableCell>
      <TableCell fontFamily="mono">{ formatRoko(era.remainder_payout) }</TableCell>
      <TableCell fontFamily="mono" color={ hasSlashes ? 'red.500' : undefined }>
        { era.slashed_count ?? 0 } { hasSlashes && era.slashed_total ? `(${ formatRoko(era.slashed_total) })` : '' }
      </TableCell>
      <TableCell>{ era.finalized ? '✓' : '⏳' }</TableCell>
    </TableRow>
  );
}

const Eras = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'substrate_eras' ],
    queryFn: () => fetchSubstrateEras(20),
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const eras = data?.items ?? [];

  return (
    <>
      <PageTitle
        title="Eras"
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Per-era validator payouts and slashing activity on the Roko Network.
          </chakra.span>
        ) }
        isLoading={ isLoading }
      />

      { isError && (
        <Box p={ 4 } borderWidth="1px" borderRadius="md" mb={ 4 } color="red.500">
          Failed to load eras. The substrate indexer may not be running.
        </Box>
      ) }

      <TableRoot variant="line">
        <TableHeader>
          <TableRow>
            <TableColumnHeader>Era</TableColumnHeader>
            <TableColumnHeader>Start block</TableColumnHeader>
            <TableColumnHeader>End block</TableColumnHeader>
            <TableColumnHeader>Validator payout</TableColumnHeader>
            <TableColumnHeader>Remainder</TableColumnHeader>
            <TableColumnHeader>Slashes</TableColumnHeader>
            <TableColumnHeader>Finalized</TableColumnHeader>
          </TableRow>
        </TableHeader>
        <TableBody>
          { isLoading && (
            <TableRow>
              <TableCell colSpan={ 7 }>
                <Flex justifyContent="center" py={ 8 }>
                  <Skeleton loading={ true } w="200px" h="20px"/>
                </Flex>
              </TableCell>
            </TableRow>
          ) }
          { !isLoading && eras.length === 0 && !isError && (
            <TableRow>
              <TableCell colSpan={ 7 }>
                <chakra.span color="text.secondary" fontSize="sm">No eras recorded yet</chakra.span>
              </TableCell>
            </TableRow>
          ) }
          { !isLoading && eras.map((era) => <EraRow key={ era.era_index } era={ era }/>) }
        </TableBody>
      </TableRoot>
    </>
  );
};

export default Eras;
