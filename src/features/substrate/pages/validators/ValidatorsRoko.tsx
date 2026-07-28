// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Flex, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { route } from 'nextjs-routes';
import React from 'react';

import PageTitle from 'src/shell/page/title/PageTitle';

import {
  fetchSubstrateValidators,
  fetchValidatorClockAttestation,
  truncateHex,
  clockSourceColor,
} from 'src/features/substrate/api/substrate-api';
import type { SubstrateValidator, ClockAttestation } from 'src/features/substrate/api/substrate-api';
import { fetchTemporalValidatorQuality, reputationToPercent } from 'src/features/temporal/api/temporal-mesh-rpc';

import { Link } from 'src/toolkit/chakra/link';
import { Skeleton } from 'src/toolkit/chakra/skeleton';
import { TableRoot, TableHeader, TableBody, TableRow, TableColumnHeader, TableCell } from 'src/toolkit/chakra/table';
import { SECOND } from 'src/toolkit/utils/consts';

const REFETCH_INTERVAL_MS = 12 * SECOND;

function qualityPctColor(pct: number): string {
  if (pct > 80) return 'green.400';
  if (pct > 50) return 'yellow.400';
  return 'red.400';
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    active: 'green.500',
    waiting: 'yellow.500',
    inactive: 'gray.500',
  };
  return (
    <Box
      as="span"
      px={ 2 }
      py={ 0.5 }
      borderRadius="md"
      fontSize="xs"
      fontWeight={ 700 }
      color="white"
      bg={ colorMap[status] ?? 'gray.500' }
      display="inline-block"
    >
      { status }
    </Box>
  );
}

function ClockQualityCell({ index }: { index: number }) {
  // Per-row live fetch of the temporal time-quality RPC. Each row caches
  // independently via useQuery so the list renders progressively.
  const { data, isLoading } = useQuery({
    queryKey: [ 'temporal_validator_quality', index ],
    queryFn: () => fetchTemporalValidatorQuality(index),
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: 0,
  });

  if (isLoading) {
    return <Skeleton loading={ true } w="64px" h="20px"/>;
  }

  if (!data) {
    return <chakra.span color="text.secondary" fontSize="sm">—</chakra.span>;
  }

  const pct = reputationToPercent(data.reputation);
  const color = qualityPctColor(pct);
  return (
    <chakra.span fontSize="sm" fontFamily="mono" color={ color }>
      { pct.toFixed(1) }%
    </chakra.span>
  );
}

function AttestationCell({ stash }: { stash: string }) {
  const { data, isLoading } = useQuery<ClockAttestation | null>({
    queryKey: [ 'substrate_validator_clock_attestation', stash ],
    queryFn: () => fetchValidatorClockAttestation(stash),
    refetchInterval: REFETCH_INTERVAL_MS * 5,
    retry: 0,
  });

  if (isLoading) {
    return <Skeleton loading={ true } w="80px" h="20px"/>;
  }

  if (!data) {
    return <chakra.span color="text.secondary" fontSize="sm">—</chakra.span>;
  }

  return (
    <Box
      as="span"
      px={ 2 }
      py={ 0.5 }
      borderRadius="md"
      fontSize="xs"
      fontWeight={ 700 }
      color="white"
      bg={ clockSourceColor(data.detected_source) }
      display="inline-block"
    >
      { data.detected_source }
    </Box>
  );
}

function ValidatorRow({ v }: { v: SubstrateValidator }) {
  const href = route({ pathname: '/validators/[id]', query: { id: v.stash } });
  return (
    <TableRow>
      <TableCell fontFamily="mono">
        <Link href={ href }>{ truncateHex(v.stash, 8, 6) }</Link>
      </TableCell>
      <TableCell>{ v.authority_index }</TableCell>
      <TableCell><StatusBadge status={ v.status }/></TableCell>
      <TableCell fontFamily="mono">{ v.first_seen_block.toLocaleString() }</TableCell>
      <TableCell fontFamily="mono">{ v.last_updated_block.toLocaleString() }</TableCell>
      <TableCell><ClockQualityCell index={ v.authority_index }/></TableCell>
      <TableCell><AttestationCell stash={ v.stash }/></TableCell>
    </TableRow>
  );
}

const ValidatorsRoko = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [ 'substrate_validators' ],
    queryFn: fetchSubstrateValidators,
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const validators = React.useMemo(() => {
    const items = data?.items ?? [];
    return [ ...items ].sort((a, b) => a.authority_index - b.authority_index);
  }, [ data ]);

  return (
    <>
      <PageTitle
        title="Validators"
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Active validators on the Roko Network — clock quality, attestation tier, and on-chain bonding state.
          </chakra.span>
        ) }
        isLoading={ isLoading }
      />

      { isError && (
        <Box p={ 4 } borderWidth="1px" borderRadius="md" mb={ 4 } color="red.500">
          Failed to load validators. The substrate indexer may not be running.
        </Box>
      ) }

      { !isError && !isLoading && validators.length === 0 && (
        <Box p={ 4 } color="text.secondary" fontSize="sm">
          No active validators reported by the substrate indexer.
        </Box>
      ) }

      <TableRoot variant="line">
        <TableHeader>
          <TableRow>
            <TableColumnHeader>Stash</TableColumnHeader>
            <TableColumnHeader>Authority idx</TableColumnHeader>
            <TableColumnHeader>Status</TableColumnHeader>
            <TableColumnHeader>First seen</TableColumnHeader>
            <TableColumnHeader>Last updated</TableColumnHeader>
            <TableColumnHeader>Clock quality</TableColumnHeader>
            <TableColumnHeader>Attested</TableColumnHeader>
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
          { !isLoading && validators.map((v) => <ValidatorRow key={ v.stash } v={ v }/>) }
        </TableBody>
      </TableRoot>
    </>
  );
};

export default ValidatorsRoko;
