// SPDX-License-Identifier: LicenseRef-Blockscout

import { Box, Code, Flex, Grid, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { route } from 'nextjs-routes';
import React from 'react';

import PageTitle from 'src/shell/page/title/PageTitle';

import PwRokoIcon from 'src/features/pwroko/components/PwRokoIcon';
import type {
  SubstrateValidator,
  SubstrateViolation,
  SubstratePwrokoEvent,
  ClockAttestation,
} from 'src/features/substrate/api/substrate-api';
import {
  fetchSubstrateValidator,
  fetchSubstrateValidatorViolations,
  fetchAccountPwrokoHistory,
  fetchValidatorClockAttestation,
  truncateHex,
  formatRoko,
  clockSourceColor,
} from 'src/features/substrate/api/substrate-api';
import {
  fetchTemporalValidatorQuality,
  formatOffsetNs,
  reputationColor,
  reputationToPercent,
} from 'src/features/temporal/api/temporal-mesh-rpc';

import getQueryParamString from 'src/shared/router/get-query-param-string';

import { Link } from 'src/toolkit/chakra/link';
import { Progress } from 'src/toolkit/chakra/progress';
import { Skeleton } from 'src/toolkit/chakra/skeleton';
import { TableRoot, TableHeader, TableBody, TableRow, TableColumnHeader, TableCell } from 'src/toolkit/chakra/table';
import { SECOND } from 'src/toolkit/utils/consts';

const REFETCH_INTERVAL_MS = 6 * SECOND;

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

function StatRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Flex
      justifyContent="space-between"
      alignItems="baseline"
      py={ 2 }
      borderBottomWidth="1px"
      borderColor={{ _light: 'gray.100', _dark: 'whiteAlpha.100' }}
      _last={{ borderBottomWidth: 0 }}
      gap={ 4 }
    >
      <chakra.span fontSize="sm" color="text.secondary" flexShrink={ 0 }>
        { label }
      </chakra.span>
      <chakra.span fontSize="sm" fontWeight={ 600 } fontFamily="mono" textAlign="right">
        { value }
      </chakra.span>
    </Flex>
  );
}

function StatusBadge({ status }: { status: string | undefined }) {
  const colorMap: Record<string, string> = {
    active: 'green.500',
    waiting: 'yellow.500',
    inactive: 'gray.500',
  };
  const color = (status && colorMap[status]) || 'gray.500';
  return (
    <Box
      as="span"
      px={ 2 }
      py={ 0.5 }
      borderRadius="md"
      fontSize="xs"
      fontWeight={ 700 }
      color="white"
      bg={ color }
      display="inline-block"
    >
      { status ?? '—' }
    </Box>
  );
}

function HeaderCard({ validator, isLoading }: { validator: SubstrateValidator | null; isLoading: boolean }) {
  return (
    <Box
      borderWidth="1px"
      borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
      borderRadius="xl"
      p={ 5 }
    >
      <Skeleton loading={ isLoading }>
        <StatRow
          label="Stash"
          value={ validator?.stash ? <chakra.span title={ validator.stash }>{ validator.stash }</chakra.span> : '—' }
        />
        <StatRow label="Authority idx" value={ validator?.authority_index ?? '—' }/>
        <StatRow label="Status" value={ <StatusBadge status={ validator?.status }/> }/>
        <StatRow label="First seen" value={ validator?.first_seen_block?.toLocaleString() ?? '—' }/>
        <StatRow label="Last updated" value={ validator?.last_updated_block?.toLocaleString() ?? '—' }/>
      </Skeleton>
    </Box>
  );
}

function ClockHealthCard({ authorityIndex }: { authorityIndex: number | undefined }) {
  const enabled = typeof authorityIndex === 'number';
  const { data, isLoading } = useQuery({
    queryKey: [ 'temporal_validator_quality', authorityIndex ],
    queryFn: () => fetchTemporalValidatorQuality(authorityIndex as number),
    refetchInterval: REFETCH_INTERVAL_MS,
    enabled,
    retry: 0,
  });

  const repPct = data ? reputationToPercent(data.reputation) : 0;
  const repColor = data ? reputationColor(data.reputation) : 'gray.300';

  return (
    <Box
      borderWidth="1px"
      borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
      borderRadius="xl"
      p={ 5 }
    >
      <chakra.h3 fontSize="md" fontWeight={ 700 } mb={ 4 }>Live clock health</chakra.h3>

      <Skeleton loading={ isLoading || !enabled } mb={ 4 }>
        <Flex justifyContent="space-between" mb={ 2 }>
          <chakra.span fontSize="sm" color="text.secondary">Reputation</chakra.span>
          <chakra.span fontSize="sm" fontWeight={ 700 } color={ repColor }>
            { repPct.toFixed(1) }%
          </chakra.span>
        </Flex>
        <Progress value={ repPct } max={ 100 } size="sm" color={ repColor } w="full" borderRadius="full"/>
      </Skeleton>

      <StatRow label="Clock offset" value={ data ? formatOffsetNs(data.clock_offset_ns) : '—' }/>
      <StatRow label="Root distance" value={ data ? formatOffsetNs(data.root_distance_ns) : '—' }/>
      <StatRow label="Samples" value={ data?.samples?.toLocaleString() ?? '—' }/>
      <StatRow label="Tier" value={ data?.tier ?? '—' }/>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Tabs
// ---------------------------------------------------------------------------

type TabId = 'violations' | 'pwroko' | 'attestation';

const TABS: Array<{ id: TabId; label: string }> = [
  { id: 'violations', label: 'Violations' },
  { id: 'pwroko', label: 'pwROKO' },
  { id: 'attestation', label: 'Clock attestation' },
];

interface TabButtonProps {
  tab: { id: TabId; label: string };
  active: boolean;
  onSelect: (id: TabId) => void;
}

const TabButton = ({ tab, active, onSelect }: TabButtonProps) => {
  const handleClick = React.useCallback(() => onSelect(tab.id), [ onSelect, tab.id ]);
  return (
    <Box
      as="button"
      px={ 4 }
      py={ 2 }
      fontSize="sm"
      fontWeight={ active ? 700 : 500 }
      color={ active ? undefined : 'text.secondary' }
      borderBottomWidth="2px"
      borderColor={ active ? 'blue.500' : 'transparent' }
      onClick={ handleClick }
    >
      { tab.label }
    </Box>
  );
};

function TabBar({ active, onSelect }: { active: TabId; onSelect: (id: TabId) => void }) {
  return (
    <Flex
      gap={ 2 }
      borderBottomWidth="1px"
      borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
      mb={ 4 }
    >
      { TABS.map((t) => (
        <TabButton key={ t.id } tab={ t } active={ active === t.id } onSelect={ onSelect }/>
      )) }
    </Flex>
  );
}

function ViolationsTab({ stash }: { stash: string }) {
  const { data, isLoading } = useQuery({
    queryKey: [ 'substrate_validator_violations', stash ],
    queryFn: () => fetchSubstrateValidatorViolations(stash),
    refetchInterval: REFETCH_INTERVAL_MS * 4,
  });

  const items = data?.items ?? [];

  if (isLoading) return <Skeleton loading={ true } w="100%" h="80px"/>;
  if (items.length === 0) {
    return <Box p={ 4 } color="text.secondary" fontSize="sm">No violations recorded</Box>;
  }

  return (
    <TableRoot variant="line">
      <TableHeader>
        <TableRow>
          <TableColumnHeader>Block</TableColumnHeader>
          <TableColumnHeader>Kind</TableColumnHeader>
          <TableColumnHeader>Severity</TableColumnHeader>
          <TableColumnHeader>Detail</TableColumnHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        { items.map((v: SubstrateViolation) => (
          <TableRow key={ v.id }>
            <TableCell fontFamily="mono">
              <Link href={ route({ pathname: '/block/[height_or_hash]', query: { height_or_hash: String(v.block_number) } }) }>
                { v.block_number.toLocaleString() }
              </Link>
            </TableCell>
            <TableCell>{ v.kind }</TableCell>
            <TableCell>{ v.severity }</TableCell>
            <TableCell>
              <chakra.span fontSize="xs" color="text.secondary">
                { v.detail ? JSON.stringify(v.detail) : '—' }
              </chakra.span>
            </TableCell>
          </TableRow>
        )) }
      </TableBody>
    </TableRoot>
  );
}

function PwrokoTab({ stash }: { stash: string }) {
  const { data, isLoading } = useQuery({
    queryKey: [ 'substrate_account_pwroko_history', stash ],
    queryFn: () => fetchAccountPwrokoHistory(stash),
    refetchInterval: REFETCH_INTERVAL_MS * 4,
  });

  const items = data?.items ?? [];

  if (isLoading) return <Skeleton loading={ true } w="100%" h="80px"/>;
  if (items.length === 0) {
    return <Box p={ 4 } color="text.secondary" fontSize="sm">No pwROKO activity</Box>;
  }

  return (
    <TableRoot variant="line">
      <TableHeader>
        <TableRow>
          <TableColumnHeader>Block</TableColumnHeader>
          <TableColumnHeader>Event</TableColumnHeader>
          <TableColumnHeader>
            <chakra.span display="inline-flex" alignItems="center" gap={ 1.5 }>
              <PwRokoIcon boxSize={ 5 }/>
              Amount
            </chakra.span>
          </TableColumnHeader>
          <TableColumnHeader>Counterparty</TableColumnHeader>
        </TableRow>
      </TableHeader>
      <TableBody>
        { items.map((row: SubstratePwrokoEvent) => {
          const counterparty = (() => {
            const lower = stash.toLowerCase();
            const from = (row.from_account ?? '').toLowerCase();
            return from === lower ? row.to_account : row.from_account;
          })();
          return (
            <TableRow key={ row.id }>
              <TableCell fontFamily="mono">
                <Link href={ route({ pathname: '/block/[height_or_hash]', query: { height_or_hash: String(row.block_number) } }) }>
                  { row.block_number.toLocaleString() }
                </Link>
              </TableCell>
              <TableCell>{ row.event_kind }</TableCell>
              <TableCell fontFamily="mono">{ formatRoko(row.amount) }</TableCell>
              <TableCell fontFamily="mono">
                { counterparty ? (
                  <Link href={ route({ pathname: '/address/[hash]', query: { hash: counterparty } }) }>
                    { truncateHex(counterparty, 6, 4) }
                  </Link>
                ) : '—' }
              </TableCell>
            </TableRow>
          );
        }) }
      </TableBody>
    </TableRoot>
  );
}

function AttestationTab({ stash }: { stash: string }) {
  const { data, isLoading, isError } = useQuery<ClockAttestation | null>({
    queryKey: [ 'substrate_validator_clock_attestation', stash ],
    queryFn: () => fetchValidatorClockAttestation(stash),
    refetchInterval: REFETCH_INTERVAL_MS * 4,
    retry: 0,
  });

  if (isLoading) return <Skeleton loading={ true } w="100%" h="80px"/>;
  if (isError) {
    return <Box p={ 4 } color="red.500" fontSize="sm">Failed to fetch clock attestation.</Box>;
  }

  if (!data) {
    // Empty state — actionable: copy-pasteable command the operator can use.
    return (
      <Box
        borderWidth="1px"
        borderRadius="xl"
        borderStyle="dashed"
        borderColor={{ _light: 'gray.300', _dark: 'whiteAlpha.300' }}
        p={ 6 }
      >
        <chakra.h4 fontWeight={ 700 } mb={ 2 }>No attestation submitted</chakra.h4>
        <chakra.p fontSize="sm" color="text.secondary" mb={ 4 }>
          This validator has not yet self-attested its clock hardware. To
          submit one from the validator host:
        </chakra.p>
        <Code display="block" whiteSpace="pre" p={ 3 } borderRadius="md" fontSize="xs">
          node scripts/onboard-validator.mjs --rpc wss://&lt;node&gt; --controller-uri //&lt;key&gt;
        </Code>
      </Box>
    );
  }

  return (
    <Box
      borderWidth="1px"
      borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
      borderRadius="xl"
      p={ 5 }
    >
      <Flex alignItems="center" gap={ 3 } mb={ 4 }>
        <chakra.span fontSize="sm" color="text.secondary">Detected source:</chakra.span>
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
      </Flex>
      <StatRow label="Root distance" value={ `${ data.root_distance_ns.toLocaleString() } ns` }/>
      <StatRow label="Calibration window" value={ `${ data.calibration_window_blocks.toLocaleString() } blocks` }/>
      <StatRow
        label="Attested at block"
        value={ (
          <Link
            href={ route({
              pathname: '/block/[height_or_hash]',
              query: { height_or_hash: String(data.attested_at_block) },
            }) }
          >
            { data.attested_at_block.toLocaleString() }
          </Link>
        ) }
      />
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const ValidatorRoko = () => {
  const router = useRouter();
  // The Blockscout dynamic route is `[id]` (defined for the historical
  // chain-type-specific pages); Roko treats the value as a 0x-prefixed stash.
  const stash = getQueryParamString(router.query.id);
  const [ activeTab, setActiveTab ] = React.useState<TabId>('violations');

  const { data: validator, isLoading } = useQuery<SubstrateValidator | null>({
    queryKey: [ 'substrate_validator', stash ],
    queryFn: () => fetchSubstrateValidator(stash),
    refetchInterval: REFETCH_INTERVAL_MS * 4,
    enabled: Boolean(stash),
  });

  if (!stash) {
    return null;
  }

  const authorityIndex = validator?.authority_index;

  return (
    <>
      <PageTitle
        title={ `Validator ${ truncateHex(stash, 8, 6) }` }
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary" fontFamily="mono">
            { stash }
          </chakra.span>
        ) }
        isLoading={ isLoading }
      />

      <Grid templateColumns={{ base: '1fr', md: '1fr 1fr' }} gap={ 4 } mb={ 6 }>
        <HeaderCard validator={ validator ?? null } isLoading={ isLoading }/>
        <ClockHealthCard authorityIndex={ authorityIndex }/>
      </Grid>

      <TabBar active={ activeTab } onSelect={ setActiveTab }/>
      { activeTab === 'violations' && <ViolationsTab stash={ stash }/> }
      { activeTab === 'pwroko' && <PwrokoTab stash={ stash }/> }
      { activeTab === 'attestation' && <AttestationTab stash={ stash }/> }
    </>
  );
};

export default ValidatorRoko;
