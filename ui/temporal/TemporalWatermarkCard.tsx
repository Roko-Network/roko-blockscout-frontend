import { Box, Flex, chakra } from '@chakra-ui/react';
import React from 'react';

import type { TemporalWatermark } from 'types/api/temporal';

import { Skeleton } from 'toolkit/chakra/skeleton';

interface Props {
  data: TemporalWatermark | undefined;
  isLoading: boolean;
}

const TemporalWatermarkCard = ({ data, isLoading }: Props) => {
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
          Temporal Watermark
        </chakra.span>
      </Skeleton>

      <Skeleton loading={ isLoading } w="fit-content" mb={ 1 }>
        <chakra.span fontSize="sm" color="text.secondary">Block </chakra.span>
        <chakra.span fontWeight={ 600 }>
          { data?.block_number?.toLocaleString() ?? '-' }
        </chakra.span>
      </Skeleton>

      <Skeleton loading={ isLoading } w="fit-content" mb={ 1 }>
        <chakra.span fontFamily="mono" fontSize="sm" wordBreak="break-all">
          { data?.watermark_ns ?? '-' } ns
        </chakra.span>
      </Skeleton>

      <Skeleton loading={ isLoading } w="fit-content">
        <chakra.span fontSize="sm" color="text.secondary">
          { data?.watermark_datetime ? new Date(data.watermark_datetime).toLocaleString(undefined, {
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

      <Flex mt={ 3 } gap={ 1 } alignItems="center">
        <Box w={ 2 } h={ 2 } borderRadius="full" bg={ isLoading ? 'gray.300' : 'green.400' }/>
        <chakra.span fontSize="xs" color="text.secondary">Live — updates every block</chakra.span>
      </Flex>
    </Box>
  );
};

export default React.memo(TemporalWatermarkCard);
