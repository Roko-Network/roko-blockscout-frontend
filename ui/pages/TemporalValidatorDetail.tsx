import { Box, Flex, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import type { TemporalValidatorReport } from 'types/api/temporalMesh';

import {
  fetchTemporalValidatorQuality,
  formatOffsetNs,
  reputationColor,
  reputationToPercent,
} from 'lib/api/services/general/temporalMeshRpc';
import { SECOND } from 'toolkit/utils/consts';
import { Skeleton } from 'toolkit/chakra/skeleton';
import { Progress } from 'toolkit/chakra/progress';
import PageTitle from 'ui/shared/Page/PageTitle';

const REFETCH_INTERVAL_MS = 6 * SECOND;

// ---------------------------------------------------------------------------
// Subcomponents
// ---------------------------------------------------------------------------

interface StatRowProps {
  label: string;
  value: React.ReactNode;
  isLoading: boolean;
}

const StatRow = ({ label, value, isLoading }: StatRowProps) => (
  <Flex
    justifyContent="space-between"
    alignItems="baseline"
    py={ 3 }
    borderBottomWidth="1px"
    borderColor={{ _light: 'gray.100', _dark: 'whiteAlpha.100' }}
    _last={{ borderBottomWidth: 0 }}
    gap={ 4 }
  >
    <chakra.span fontSize="sm" color="text.secondary" flexShrink={ 0 }>
      { label }
    </chakra.span>
    <Skeleton loading={ isLoading } w="fit-content">
      <chakra.span fontSize="sm" fontWeight={ 600 } fontFamily="mono" textAlign="right">
        { value }
      </chakra.span>
    </Skeleton>
  </Flex>
);

function TierBadge({ tier }: { tier: TemporalValidatorReport['tier'] }) {
  const colorMap: Record<TemporalValidatorReport['tier'], string> = {
    Anchor: '#0078D4',
    Standard: 'green.500',
    Minimal: 'orange.500',
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
      bg={ colorMap[tier] }
      display="inline-block"
    >
      { tier }
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface Props {
  /** Authority index of the validator (from the URL param). */
  index: number;
}

const TemporalValidatorDetail = ({ index }: Props) => {
  const { data, isLoading } = useQuery<TemporalValidatorReport>({
    queryKey: [ 'temporal_validator_quality', index ],
    queryFn: () => fetchTemporalValidatorQuality(index),
    refetchInterval: REFETCH_INTERVAL_MS,
    retry: 1,
  });

  const repPct = data ? reputationToPercent(data.reputation) : 0;
  const repColor = data ? reputationColor(data.reputation) : 'gray.300';

  return (
    <>
      <PageTitle
        title={ `Validator #${ index } — Time Health` }
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Nanosecond-precision time health report for authority index { index }
          </chakra.span>
        ) }
        isLoading={ isLoading }
      />

      <Box
        borderWidth="1px"
        borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
        borderRadius="xl"
        p={ 6 }
        maxW="640px"
      >
        { /* Reputation bar — prominent at the top of the card */ }
        <Skeleton loading={ isLoading } mb={ 6 }>
          <Flex justifyContent="space-between" alignItems="center" mb={ 2 }>
            <chakra.span fontSize="sm" color="text.secondary">Reputation</chakra.span>
            <chakra.span fontSize="sm" fontWeight={ 700 } color={ repColor }>
              { repPct }%
            </chakra.span>
          </Flex>
          <Progress
            value={ repPct }
            max={ 100 }
            size="sm"
            color={ repColor }
            w="full"
            borderRadius="full"
          />
        </Skeleton>

        <StatRow label="Authority Index" value={ data?.authority_index ?? '—' } isLoading={ isLoading }/>

        <StatRow
          label="Clock Offset"
          value={ data ? formatOffsetNs(data.clock_offset_ns) : '—' }
          isLoading={ isLoading }
        />

        <StatRow
          label="Root Distance"
          value={ data ? formatOffsetNs(data.root_distance_ns) : '—' }
          isLoading={ isLoading }
        />

        <StatRow
          label="Tier"
          value={ data ? <TierBadge tier={ data.tier }/> : '—' }
          isLoading={ isLoading }
        />

        <StatRow
          label="Samples"
          value={ data?.samples?.toLocaleString() ?? '—' }
          isLoading={ isLoading }
        />

        <StatRow
          label="Violations"
          value={ (
            <chakra.span color={ (data?.violation_count ?? 0) > 0 ? 'red.500' : undefined }>
              { data?.violation_count ?? '—' }
            </chakra.span>
          ) }
          isLoading={ isLoading }
        />

        <StatRow
          label="Last Checkpoint"
          value={ data ? `Block ${ data.last_checkpoint_block.toLocaleString() }` : '—' }
          isLoading={ isLoading }
        />
      </Box>
    </>
  );
};

export default TemporalValidatorDetail;
