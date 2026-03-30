import { Box, Flex, chakra } from '@chakra-ui/react';
import React from 'react';

import type { TemporalMetrics } from 'src/features/temporal/types/api';

import { Skeleton } from 'src/toolkit/chakra/skeleton';

interface Props {
  data: TemporalMetrics | undefined;
  isLoading: boolean;
}

interface StatRowProps {
  label: string;
  value: React.ReactNode;
  isLoading: boolean;
  indicator?: 'healthy' | 'warning' | 'none';
}

const StatRow = ({ label, value, isLoading, indicator = 'none' }: StatRowProps) => (
  <Flex
    justifyContent="space-between"
    alignItems="baseline"
    py={ 2 }
    borderBottomWidth="1px"
    borderColor="border.divider"
    _last={{ borderBottomWidth: 0 }}
  >
    <Flex alignItems="center" gap={ 2 }>
      { indicator === 'healthy' && (
        <Box
          as="span"
          w={ 2 }
          h={ 2 }
          borderRadius="full"
          bg="green.400"
          flexShrink={ 0 }
          data-testid="healthy-indicator"
        />
      ) }
      { indicator === 'warning' && (
        <Box
          as="span"
          w={ 2 }
          h={ 2 }
          borderRadius="full"
          bg="orange.400"
          flexShrink={ 0 }
          data-testid="warning-indicator"
        />
      ) }
      <chakra.span fontSize="sm" color="text.secondary">{ label }</chakra.span>
    </Flex>
    <Skeleton loading={ isLoading } w="fit-content">
      <chakra.span fontSize="sm" fontWeight={ 600 }>{ value }</chakra.span>
    </Skeleton>
  </Flex>
);

function healthIndicator(value: number | undefined): 'healthy' | 'warning' | 'none' {
  if (value === undefined) return 'none';
  return value === 0 ? 'healthy' : 'warning';
}

const TemporalMetricsCard = ({ data, isLoading }: Props) => {
  return (
    <Box
      borderWidth="1px"
      borderTopWidth="3px"
      borderTopColor="link.primary"
      borderColor="border.divider"
      borderRadius="xl"
      p={ 6 }
    >
      <Skeleton loading={ isLoading } mb={ 4 } w="fit-content">
        <chakra.span
          fontWeight={ 600 }
          fontSize="sm"
          color="text.secondary"
          textTransform="uppercase"
          letterSpacing="wide"
        >
          Network Temporal Health
        </chakra.span>
      </Skeleton>

      <StatRow
        label="Temporal transactions"
        value={ data?.total_temporal_transactions?.toLocaleString() ?? '-' }
        isLoading={ isLoading }
      />
      <StatRow
        label="Validation failures"
        value={ data?.total_validation_failures?.toLocaleString() ?? '-' }
        isLoading={ isLoading }
        indicator={ healthIndicator(data?.total_validation_failures) }
      />
      <StatRow
        label="Ordering violations"
        value={ data?.total_ordering_violations?.toLocaleString() ?? '-' }
        isLoading={ isLoading }
        indicator={ healthIndicator(data?.total_ordering_violations) }
      />
      <StatRow
        label="Active temporal keys"
        value={ data?.active_temporal_keys?.toLocaleString() ?? '-' }
        isLoading={ isLoading }
      />
      <StatRow
        label="Expired txs cleaned"
        value={ data?.expired_transactions_cleaned?.toLocaleString() ?? '-' }
        isLoading={ isLoading }
      />
    </Box>
  );
};

export default React.memo(TemporalMetricsCard);
