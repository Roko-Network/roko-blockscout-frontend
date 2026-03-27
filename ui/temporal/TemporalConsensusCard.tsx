import { Box, Flex, chakra } from '@chakra-ui/react';
import React from 'react';

import type { TemporalConsensusTime } from 'types/api/temporal';

import { Progress } from 'toolkit/chakra/progress';
import { Skeleton } from 'toolkit/chakra/skeleton';

interface Props {
  data: TemporalConsensusTime | undefined;
  isLoading: boolean;
}

function getQualityColor(quality: number): string {
  if (quality >= 90) {
    return 'green.400';
  }
  if (quality >= 70) {
    return 'yellow.400';
  }
  return 'red.400';
}

const TemporalConsensusCard = ({ data, isLoading }: Props) => {
  const quality = data?.quality_percent ?? 0;
  const qualityColor = getQualityColor(quality);

  return (
    <Box
      borderWidth="1px"
      borderTopWidth="3px"
      borderTopColor="#0078D4"
      borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
      borderRadius="xl"
      p={ 6 }
    >
      <Skeleton loading={ isLoading } mb={ 2 } w="fit-content">
        <chakra.span fontWeight={ 600 } fontSize="sm" color="text.secondary" textTransform="uppercase" letterSpacing="wide">
          Mesh Consensus Time
        </chakra.span>
      </Skeleton>

      <Skeleton loading={ isLoading } w="fit-content" mb={ 1 }>
        <chakra.span fontFamily="mono" fontSize="sm" wordBreak="break-all">
          { data?.consensus_time_ns ?? '-' } ns
        </chakra.span>
      </Skeleton>

      <Skeleton loading={ isLoading } w="fit-content" mb={ 4 }>
        <chakra.span fontSize="sm" color="text.secondary">
          { data?.consensus_time_datetime ? new Date(data.consensus_time_datetime).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
          }) : '-' }
        </chakra.span>
      </Skeleton>

      <Skeleton loading={ isLoading } w="fit-content" mb={ 1 }>
        <Flex justifyContent="space-between" alignItems="center" mb={ 1 }>
          <chakra.span fontSize="sm" color="text.secondary">Time quality</chakra.span>
          <chakra.span fontSize="sm" fontWeight={ 600 } color={ qualityColor }>
            { quality.toFixed(1) }%
          </chakra.span>
        </Flex>
        <Progress
          value={ quality }
          max={ 100 }
          size="sm"
          color={ qualityColor }
          w="full"
          borderRadius="full"
          minW="200px"
        />
      </Skeleton>

      <Flex mt={ 4 } gap={ 4 }>
        <Skeleton loading={ isLoading } w="fit-content">
          <Flex gap={ 1 } alignItems="center">
            <Box
              w={ 2 }
              h={ 2 }
              borderRadius="full"
              bg={ (() => {
                if (isLoading) return 'gray.300';
                return data?.is_converged ? 'green.400' : 'orange.400';
              })() }
            />
            <chakra.span fontSize="xs" color="text.secondary">
              { data?.is_converged ? 'Converged' : 'Converging' }
            </chakra.span>
          </Flex>
        </Skeleton>

        <Skeleton loading={ isLoading } w="fit-content">
          <chakra.span fontSize="xs" color="text.secondary">
            { data?.validator_count ?? '-' } validator{ (data?.validator_count ?? 0) !== 1 ? 's' : '' } in mesh
          </chakra.span>
        </Skeleton>
      </Flex>
    </Box>
  );
};

export default React.memo(TemporalConsensusCard);
