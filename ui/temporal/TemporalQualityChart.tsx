import { Box, Flex, Heading, Text, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import { Skeleton } from 'toolkit/chakra/skeleton';
import { SECOND } from 'toolkit/utils/consts';

interface QualitySample {
  timestamp: number;
  quality: number;
  converged: boolean;
  peer_count: number;
  watermark: number;
}

interface ChartResponse {
  chart_data: Array<QualitySample>;
}

async function fetchQualityChart(): Promise<ChartResponse> {
  const response = await fetch('/api/v2/temporal/quality-chart');
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json() as Promise<ChartResponse>;
}

// Downsample to max N points for SVG rendering
function downsample(data: Array<QualitySample>, maxPoints: number): Array<QualitySample> {
  if (data.length <= maxPoints) return data;
  const step = Math.ceil(data.length / maxPoints);
  return data.filter((_, i) => i % step === 0);
}

const CHART_WIDTH = 600;
const CHART_HEIGHT = 120;
const REFRESH_MS = 30 * SECOND;

const TemporalQualityChart: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: [ 'temporal_quality_chart' ],
    queryFn: fetchQualityChart,
    refetchInterval: REFRESH_MS,
  });

  const samples = data?.chart_data ?? [];
  const displaySamples = downsample(samples, 200);

  // Build SVG path
  const buildPath = (): string => {
    if (displaySamples.length < 2) return '';

    const minT = displaySamples[0]?.timestamp ?? 0;
    const maxT = displaySamples[displaySamples.length - 1]?.timestamp ?? 1;
    const tRange = maxT - minT || 1;

    return displaySamples
      .map((s, i) => {
        const x = ((s.timestamp - minT) / tRange) * CHART_WIDTH;
        const y = CHART_HEIGHT - (s.quality / 10000) * CHART_HEIGHT;
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Build area fill path
  const buildAreaPath = (): string => {
    const linePath = buildPath();
    if (!linePath) return '';

    const minT = displaySamples[0]?.timestamp ?? 0;
    const maxT = displaySamples[displaySamples.length - 1]?.timestamp ?? 1;
    const tRange = maxT - minT || 1;

    const lastX = ((maxT - minT) / tRange) * CHART_WIDTH;
    return `${linePath} L${lastX.toFixed(1)},${CHART_HEIGHT} L0,${CHART_HEIGHT} Z`;
  };

  const latestQuality = displaySamples.length > 0
    ? (displaySamples[displaySamples.length - 1]?.quality ?? 0) / 100
    : 0;

  const timeRangeLabel = (): string => {
    if (displaySamples.length < 2) return '';
    const firstMs = displaySamples[0]?.timestamp ?? 0;
    const lastMs = displaySamples[displaySamples.length - 1]?.timestamp ?? 0;
    const diffMin = Math.round((lastMs - firstMs) / 60000);
    if (diffMin < 60) return `Last ${diffMin} min`;
    const diffH = (diffMin / 60).toFixed(1);
    return `Last ${diffH} hours`;
  };

  return (
    <Box
      borderWidth="1px"
      borderColor="whiteAlpha.200"
      borderRadius="lg"
      p={ 4 }
      bg="#1A202C"
    >
      <Flex justifyContent="space-between" alignItems="center" mb={ 3 }>
        <Heading as="h3" fontSize="md" fontFamily="heading" color="white">
          Time Quality History
        </Heading>
        <Flex gap={ 3 } alignItems="center">
          <chakra.span fontSize="xs" color="whiteAlpha.600">
            { timeRangeLabel() }
          </chakra.span>
          <chakra.span fontSize="sm" fontWeight={ 600 } color="#0078D4">
            { latestQuality.toFixed(1) }%
          </chakra.span>
        </Flex>
      </Flex>

      <Skeleton loading={ isLoading } h="120px" borderRadius="md">
        { displaySamples.length < 2 ? (
          <Flex h="120px" alignItems="center" justifyContent="center">
            <Text fontSize="sm" color="whiteAlpha.600">
              Collecting samples... ({ samples.length } so far)
            </Text>
          </Flex>
        ) : (
          <Box position="relative" h="120px" overflow="hidden">
            <svg
              width="100%"
              height={ CHART_HEIGHT }
              viewBox={ `0 0 ${CHART_WIDTH} ${CHART_HEIGHT}` }
              preserveAspectRatio="none"
            >
              { /* Grid lines at 25%, 50%, 75% */ }
              <line x1="0" y1={ CHART_HEIGHT * 0.25 } x2={ CHART_WIDTH } y2={ CHART_HEIGHT * 0.25 } stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
              <line x1="0" y1={ CHART_HEIGHT * 0.5 } x2={ CHART_WIDTH } y2={ CHART_HEIGHT * 0.5 } stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
              <line x1="0" y1={ CHART_HEIGHT * 0.75 } x2={ CHART_WIDTH } y2={ CHART_HEIGHT * 0.75 } stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
              { /* Area fill */ }
              <path d={ buildAreaPath() } fill="rgba(0,120,212,0.25)"/>
              { /* Line */ }
              <path d={ buildPath() } fill="none" stroke="#0078D4" strokeWidth="3" vectorEffect="non-scaling-stroke"/>
              { /* Dots at each sample point */ }
              { displaySamples.map((s, i) => {
                const minT = displaySamples[0]?.timestamp ?? 0;
                const maxT = displaySamples[displaySamples.length - 1]?.timestamp ?? 1;
                const tRange = maxT - minT || 1;
                const cx = ((s.timestamp - minT) / tRange) * CHART_WIDTH;
                const cy = CHART_HEIGHT - (s.quality / 10000) * CHART_HEIGHT;
                return <circle key={ i } cx={ cx } cy={ cy } r="3" fill="#0078D4" opacity="0.7"/>;
              }) }
            </svg>
            { /* Y-axis labels */ }
            <chakra.span position="absolute" top="0" right="4px" fontSize="10px" color="whiteAlpha.500">100%</chakra.span>
            <chakra.span position="absolute" top="50%" right="4px" fontSize="10px" color="whiteAlpha.500" transform="translateY(-50%)">50%</chakra.span>
            <chakra.span position="absolute" bottom="0" right="4px" fontSize="10px" color="whiteAlpha.500">0%</chakra.span>
          </Box>
        ) }
      </Skeleton>
    </Box>
  );
};

export default React.memo(TemporalQualityChart);
