import { Box, Flex, chakra } from '@chakra-ui/react';
import React from 'react';

import type { TemporalWatermark } from 'src/features/temporal/types/api';

import { Skeleton } from 'src/toolkit/chakra/skeleton';

interface Props {
  data: TemporalWatermark | undefined;
  isLoading: boolean;
}

const TemporalWatermarkCard = ({ data, isLoading }: Props) => {
  const isEstablished = Boolean(data && data.watermark_ns !== '0');
  let statusColor = 'orange.300';
  if (isLoading) {
    statusColor = 'gray.300';
  } else if (isEstablished) {
    statusColor = 'green.400';
  }

  return (
    <Box
      borderWidth="1px"
      borderTopWidth="3px"
      borderTopColor="link.primary"
      borderColor="border.divider"
      borderRadius="xl"
      p={ 6 }
    >
      <Skeleton loading={ isLoading } mb={ 2 } w="fit-content">
        <chakra.span fontWeight={ 600 } fontSize="sm" color="text.secondary" textTransform="uppercase" letterSpacing="wide">
          Transaction Watermark
        </chakra.span>
      </Skeleton>

      <Skeleton loading={ isLoading } w="fit-content" mb={ 1 }>
        <chakra.span fontSize="sm" color="text.secondary">Observed at block </chakra.span>
        <chakra.span fontWeight={ 600 }>
          { data?.block_number?.toLocaleString() ?? '-' }
        </chakra.span>
      </Skeleton>

      <Skeleton loading={ isLoading } w="fit-content" mb={ 1 }>
        <chakra.span fontFamily="mono" fontSize="sm" wordBreak="break-all">
          { isEstablished ? `${ data?.watermark_ns } ns` : 'Not established' }
        </chakra.span>
      </Skeleton>

      <Skeleton loading={ isLoading } w="fit-content">
        <chakra.span fontSize="sm" color="text.secondary">
          { isEstablished && data?.watermark_datetime ? new Date(data.watermark_datetime).toLocaleString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            timeZoneName: 'short',
          }) : 'Awaiting first stamped transaction' }
        </chakra.span>
      </Skeleton>

      <Flex mt={ 3 } gap={ 1 } alignItems="center">
        <Box w={ 2 } h={ 2 } borderRadius="full" bg={ statusColor }/>
        <chakra.span fontSize="xs" color="text.secondary">
          { isEstablished ? 'Advances when stamped transactions finalize' : 'No stamped transactions finalized' }
        </chakra.span>
      </Flex>
    </Box>
  );
};

export default React.memo(TemporalWatermarkCard);
