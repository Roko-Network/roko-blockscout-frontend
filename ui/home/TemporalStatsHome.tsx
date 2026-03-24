import { Box, Flex, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import {
  fetchTemporalConsensusTime,
  fetchTemporalQueueStats,
  fetchTemporalWatermark,
} from 'lib/api/services/general/temporalRpc';
import { TEMPORAL_CONSENSUS_TIME, TEMPORAL_QUEUE_STATS, TEMPORAL_WATERMARK } from 'stubs/temporal';
import { SECOND } from 'toolkit/utils/consts';
import { Link } from 'toolkit/chakra/link';
import { Skeleton } from 'toolkit/chakra/skeleton';

const BLOCK_TIME_MS = 6 * SECOND;

// Quality indicator dot color based on percentage thresholds.
function qualityDotColor(quality: number, isLoading: boolean): string {
  if (isLoading) {
    return 'gray.300';
  }
  if (quality >= 90) {
    return 'green.400';
  }
  if (quality >= 70) {
    return 'yellow.400';
  }
  return 'red.400';
}

// Format a ISO 8601 datetime string as "Mar 24, 2026 18:45:32.123"
function formatWatermark(datetime: string | undefined): string {
  if (!datetime) {
    return '\u2014';
  }
  const date = new Date(datetime);
  if (isNaN(date.getTime())) {
    return '\u2014';
  }
  const datePart = date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${ datePart } ${ timePart }.${ ms }`;
}

interface MetricProps {
  label: string;
  value: React.ReactNode;
  isLoading: boolean;
}

// Use span-based elements throughout to avoid invalid block-in-inline HTML nesting.
const Metric = ({ label, value, isLoading }: MetricProps) => (
  <Flex direction="column" minW="0" flex="1">
    <Skeleton loading={ isLoading } w="fit-content">
      <chakra.span
        display="block"
        textStyle="xs"
        color="text.secondary"
        fontWeight={ 500 }
        textTransform="uppercase"
        letterSpacing="wide"
      >
        { label }
      </chakra.span>
    </Skeleton>
    <Skeleton loading={ isLoading } w="fit-content" mt={ 0.5 }>
      <chakra.span
        display="block"
        textStyle="sm"
        fontWeight={ 600 }
        whiteSpace="nowrap"
        overflow="hidden"
        textOverflow="ellipsis"
      >
        { value }
      </chakra.span>
    </Skeleton>
  </Flex>
);

const TemporalStatsHome = () => {
  const watermarkQuery = useQuery({
    queryKey: [ 'temporal_watermark_home' ],
    queryFn: fetchTemporalWatermark,
    placeholderData: TEMPORAL_WATERMARK,
    refetchInterval: BLOCK_TIME_MS,
  });

  const consensusTimeQuery = useQuery({
    queryKey: [ 'temporal_consensus_time_home' ],
    queryFn: fetchTemporalConsensusTime,
    placeholderData: TEMPORAL_CONSENSUS_TIME,
    refetchInterval: BLOCK_TIME_MS,
  });

  const queueStatsQuery = useQuery({
    queryKey: [ 'temporal_queue_stats_home' ],
    queryFn: fetchTemporalQueueStats,
    placeholderData: TEMPORAL_QUEUE_STATS,
    refetchInterval: BLOCK_TIME_MS,
  });

  const isLoading =
    watermarkQuery.isPlaceholderData ||
    consensusTimeQuery.isPlaceholderData ||
    queueStatsQuery.isPlaceholderData;

  // Watermark: show human-readable datetime or em-dash
  const watermarkValue = (() => {
    if (watermarkQuery.isError) {
      return '\u2014';
    }
    return formatWatermark(watermarkQuery.data?.watermark_datetime);
  })();

  // Quality: percentage with colored dot
  const quality = consensusTimeQuery.isError ? undefined : consensusTimeQuery.data?.quality_percent;
  const qualityValue = quality !== undefined ? `${ quality.toFixed(1) }%` : '\u2014';
  const dotColor = quality !== undefined ? qualityDotColor(quality, isLoading) : 'gray.300';

  // Queue depth: "N pending" or "0 idle"
  const queueDepth = queueStatsQuery.isError ? undefined : queueStatsQuery.data?.queue_depth;
  const queueValue = (() => {
    if (queueDepth === undefined) {
      return '\u2014';
    }
    return queueDepth === 0 ? `${ queueDepth } idle` : `${ queueDepth } pending`;
  })();

  // Total stamped: "1,234 txs stamped"
  const totalStamped = queueStatsQuery.isError ? undefined : queueStatsQuery.data?.total_stamped;
  const totalStampedValue = totalStamped !== undefined
    ? `${ totalStamped.toLocaleString() } txs stamped`
    : '\u2014';

  return (
    <Box
      borderWidth="1px"
      borderColor={{ _light: 'gray.100', _dark: 'whiteAlpha.200' }}
      borderRadius="base"
      px={ 4 }
      py={ 3 }
    >
      <Flex alignItems="center" gap={ 2 } mb={ 2 }>
        <chakra.span
          fontFamily="heading"
          fontWeight={ 700 }
          fontSize="sm"
          color="#0078D4"
          letterSpacing="wide"
          textTransform="uppercase"
        >
          Temporal Ordering
        </chakra.span>
        <Link href="/temporal" variant="plain" fontSize="xs" color="link">
          View details
        </Link>
      </Flex>

      <Flex gap={{ base: 4, md: 8 }} flexWrap="wrap" alignItems="flex-start">

        { /* Watermark */ }
        <Metric label="Watermark" value={ watermarkValue } isLoading={ isLoading }/>

        { /* Mesh Quality with dot indicator */ }
        <Metric
          label="Mesh Quality"
          isLoading={ isLoading }
          value={
            <Flex as="span" display="inline-flex" alignItems="center" gap={ 1.5 }>
              <Box as="span" display="inline-block" w={ 2 } h={ 2 } borderRadius="full" bg={ dotColor } flexShrink={ 0 }/>
              <chakra.span>{ qualityValue }</chakra.span>
            </Flex>
          }
        />

        { /* Queue Depth */ }
        <Metric label="Queue Depth" value={ queueValue } isLoading={ isLoading }/>

        { /* Total Stamped */ }
        <Metric label="Total Stamped" value={ totalStampedValue } isLoading={ isLoading }/>

      </Flex>
    </Box>
  );
};

export default TemporalStatsHome;
