import { Box, Flex, Grid, chakra } from '@chakra-ui/react';
import React from 'react';

import type { TemporalQueueStats } from 'types/api/temporal';

import { Skeleton } from 'toolkit/chakra/skeleton';

interface Props {
  data: TemporalQueueStats | undefined;
  isLoading: boolean;
}

interface StatRowProps {
  label: string;
  value: React.ReactNode;
  isLoading: boolean;
}

const StatRow = ({ label, value, isLoading }: StatRowProps) => (
  <Flex justifyContent="space-between" alignItems="baseline" py={ 2 }
    borderBottomWidth="1px"
    borderColor={{ _light: 'gray.100', _dark: 'whiteAlpha.100' }}
    _last={{ borderBottomWidth: 0 }}
  >
    <chakra.span fontSize="sm" color="text.secondary">{ label }</chakra.span>
    <Skeleton loading={ isLoading } w="fit-content">
      <chakra.span fontSize="sm" fontWeight={ 600 }>{ value }</chakra.span>
    </Skeleton>
  </Flex>
);

const TemporalQueueCard = ({ data, isLoading }: Props) => {
  return (
    <Box
      borderWidth="1px"
      borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
      borderRadius="xl"
      p={ 6 }
    >
      <Skeleton loading={ isLoading } mb={ 4 } w="fit-content">
        <chakra.span fontWeight={ 600 } fontSize="sm" color="text.secondary" textTransform="uppercase" letterSpacing="wide">
          Fee-Priority Queue
        </chakra.span>
      </Skeleton>

      <StatRow
        label="Queue depth"
        value={ data?.queue_depth?.toLocaleString() ?? '-' }
        isLoading={ isLoading }
      />
      <StatRow
        label="Total stamped"
        value={ data?.total_stamped?.toLocaleString() ?? '-' }
        isLoading={ isLoading }
      />
      <StatRow
        label="Avg wait (p50)"
        value={ data?.avg_wait_ms !== undefined ? `${ data.avg_wait_ms } ms` : '-' }
        isLoading={ isLoading }
      />
      <StatRow
        label="p95 wait"
        value={ data?.p95_wait_ms !== undefined ? `${ data.p95_wait_ms } ms` : '-' }
        isLoading={ isLoading }
      />

      <Grid templateColumns="1fr 1fr" gap={ 3 } mt={ 4 }>
        <Skeleton loading={ isLoading } borderRadius="lg">
          <Box
            borderWidth="1px"
            borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.200' }}
            borderRadius="lg"
            p={ 3 }
            textAlign="center"
          >
            <Box
              w={ 2 }
              h={ 2 }
              borderRadius="full"
              bg={ (() => {
                if (isLoading) return 'gray.300';
                return data?.fee_priority_enabled ? 'green.400' : 'gray.400';
              })() }
              mx="auto"
              mb={ 1 }
            />
            <chakra.span fontSize="xs" color="text.secondary" display="block">Fee priority</chakra.span>
            <chakra.span fontSize="xs" fontWeight={ 600 }>
              { data?.fee_priority_enabled ? 'Enabled' : 'Disabled' }
            </chakra.span>
          </Box>
        </Skeleton>

        <Skeleton loading={ isLoading } borderRadius="lg">
          <Box
            borderWidth="1px"
            borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.200' }}
            borderRadius="lg"
            p={ 3 }
            textAlign="center"
          >
            <Box
              w={ 2 }
              h={ 2 }
              borderRadius="full"
              bg={ (() => {
                if (isLoading) return 'gray.300';
                return data?.inclusion_enforce ? 'green.400' : 'orange.400';
              })() }
              mx="auto"
              mb={ 1 }
            />
            <chakra.span fontSize="xs" color="text.secondary" display="block">
              Inclusion ({ data?.inclusion_deadline_secs ?? 15 }s deadline)
            </chakra.span>
            <chakra.span fontSize="xs" fontWeight={ 600 }>
              { data?.inclusion_enforce ? 'Enforced' : 'Unenforced' }
            </chakra.span>
          </Box>
        </Skeleton>
      </Grid>
    </Box>
  );
};

export default React.memo(TemporalQueueCard);
