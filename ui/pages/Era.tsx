import { Box, Flex, Grid, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';

import { route } from 'nextjs-routes';

import {
  fetchSubstrateEra,
  fetchSubstrateEraSlashes,
  formatRoko,
  truncateHex,
} from 'lib/api/services/general/substrateApi';
import type { SubstrateEra, SubstrateSlash } from 'lib/api/services/general/substrateApi';
import getQueryParamString from 'lib/router/getQueryParamString';
import { Link } from 'toolkit/chakra/link';
import { Skeleton } from 'toolkit/chakra/skeleton';
import { TableRoot, TableHeader, TableBody, TableRow, TableColumnHeader, TableCell } from 'toolkit/chakra/table';
import { SECOND } from 'toolkit/utils/consts';
import PageTitle from 'ui/shared/Page/PageTitle';

const REFETCH_INTERVAL_MS = 30 * SECOND;

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Flex
      justifyContent="space-between"
      alignItems="baseline"
      py={ 2 }
      borderBottomWidth="1px"
      borderColor="border.divider"
      _last={{ borderBottomWidth: 0 }}
      gap={ 4 }
    >
      <chakra.span fontSize="sm" color="text.secondary">{ label }</chakra.span>
      <chakra.span fontSize="sm" fontWeight={ 600 } fontFamily="mono" textAlign="right">{ value }</chakra.span>
    </Flex>
  );
}

function formatFinalized(era: SubstrateEra | null): string {
  if (!era) return '—';
  return era.finalized ? '✓' : '⏳';
}

function EraSummaryCard({ era, isLoading }: { era: SubstrateEra | null; isLoading: boolean }) {
  return (
    <Box
      borderWidth="2px"
      borderColor="border.divider"
      borderRadius="base"
      bg="bg.elevated"
      p={ 5 }
    >
      <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 4 }>Era summary</chakra.h3>
      <Skeleton loading={ isLoading }>
        <StatRow label="Era index" value={ era?.era_index ?? '—' }/>
        <StatRow label="Start block" value={ era?.start_block?.toLocaleString() ?? '—' }/>
        <StatRow label="End block" value={ era?.end_block?.toLocaleString() ?? '—' }/>
        <StatRow label="Sessions" value={ era ? `${ era.start_session ?? '—' } → ${ era.end_session ?? '—' }` : '—' }/>
        <StatRow label="Validator count" value={ era?.validator_count ?? '—' }/>
        <StatRow label="Total stake" value={ formatRoko(era?.total_stake) }/>
        <StatRow label="Validator payout" value={ formatRoko(era?.validator_payout) }/>
        <StatRow label="Remainder payout" value={ formatRoko(era?.remainder_payout) }/>
        <StatRow
          label="Slashes"
          value={ era ? `${ era.slashed_count ?? 0 } (${ formatRoko(era.slashed_total) })` : '—' }
        />
        <StatRow label="Finalized" value={ formatFinalized(era) }/>
      </Skeleton>
    </Box>
  );
}

function SlashesTable({ slashes, isLoading }: { slashes: Array<SubstrateSlash>; isLoading: boolean }) {
  if (isLoading) {
    return <Skeleton loading={ true } w="100%" h="120px"/>;
  }

  if (slashes.length === 0) {
    return <Box p={ 4 } color="text.secondary" fontSize="sm">No slashing events in this era.</Box>;
  }

  return (
    <TableRoot variant="line">
      <TableHeader>
        <TableRow>
          <TableColumnHeader>Block</TableColumnHeader>
          <TableColumnHeader>Stash</TableColumnHeader>
          <TableColumnHeader>Offence</TableColumnHeader>
          <TableColumnHeader>Amount</TableColumnHeader>
          <TableColumnHeader>Reporters</TableColumnHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        { slashes.map((s) => (
          <TableRow key={ s.id }>
            <TableCell fontFamily="mono">
              <Link
                href={ route({
                  pathname: '/block/[height_or_hash]',
                  query: { height_or_hash: String(s.block_number) },
                }) }
              >
                { s.block_number.toLocaleString() }
              </Link>
            </TableCell>
            <TableCell fontFamily="mono">
              <Link href={ route({ pathname: '/validators/[id]', query: { id: s.stash } }) }>
                { truncateHex(s.stash) }
              </Link>
            </TableCell>
            <TableCell>{ s.offence_kind }</TableCell>
            <TableCell fontFamily="mono" color="red.500">{ formatRoko(s.slash_amount) }</TableCell>
            <TableCell fontFamily="mono" fontSize="xs">
              { (s.reporters ?? []).map((r) => truncateHex(r)).join(', ') || '—' }
            </TableCell>
          </TableRow>
        )) }
      </TableBody>
    </TableRoot>
  );
}

const Era = () => {
  const router = useRouter();
  const n = Number(getQueryParamString(router.query.n));

  const { data: era, isLoading: eraLoading, isError } = useQuery<SubstrateEra | null>({
    queryKey: [ 'substrate_era', n ],
    queryFn: () => fetchSubstrateEra(n),
    refetchInterval: REFETCH_INTERVAL_MS,
    enabled: Number.isFinite(n),
  });

  const { data: slashesData, isLoading: slashesLoading } = useQuery({
    queryKey: [ 'substrate_era_slashes', n ],
    queryFn: () => fetchSubstrateEraSlashes(n),
    refetchInterval: REFETCH_INTERVAL_MS,
    enabled: Number.isFinite(n) && Boolean(era),
  });

  if (!Number.isFinite(n)) {
    return <Box p={ 4 }>Invalid era index</Box>;
  }

  return (
    <>
      <PageTitle
        title={ `Era ${ n }` }
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Validator payouts and slashing events for era { n }.
          </chakra.span>
        ) }
        isLoading={ eraLoading }
      />

      { isError && (
        <Box p={ 4 } borderWidth="1px" borderRadius="md" mb={ 4 } color="red.500">
          Era { n } not found.
        </Box>
      ) }

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={ 4 } mb={ 6 }>
        <EraSummaryCard era={ era ?? null } isLoading={ eraLoading }/>
        <Box
          borderWidth="2px"
          borderColor="border.divider"
          borderRadius="base"
          bg="bg.elevated"
          p={ 5 }
        >
          <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 4 }>Validator set snapshot</chakra.h3>
          <chakra.p fontSize="sm" color="text.secondary">
            Per-era validator set snapshots will appear here once TICKET-17
            backfills the session-keys / bonded-amount indexer hooks.
          </chakra.p>
        </Box>
      </Grid>

      <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 3 }>Slashing events</chakra.h3>
      <SlashesTable slashes={ slashesData?.items ?? [] } isLoading={ slashesLoading }/>
    </>
  );
};

export default Era;
