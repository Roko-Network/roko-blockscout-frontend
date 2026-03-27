import { Box, Flex, Grid, chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import type { TemporalMeshState, TemporalValidatorReport } from 'types/api/temporalMesh';

import {
  fetchTemporalMeshState,
  formatOffsetNs,
  convergenceColor,
  reputationColor,
  reputationToPercent,
} from 'lib/api/services/general/temporalMeshRpc';
import { SECOND } from 'toolkit/utils/consts';
import { Skeleton } from 'toolkit/chakra/skeleton';
import {
  TableRoot,
  TableHeader,
  TableBody,
  TableRow,
  TableColumnHeader,
  TableCell,
} from 'toolkit/chakra/table';
import PageTitle from 'ui/shared/Page/PageTitle';

const REFETCH_INTERVAL_MS = 6 * SECOND;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  isLoading,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  isLoading: boolean;
  accent?: string;
}) {
  return (
    <Box
      borderWidth="1px"
      borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
      borderRadius="xl"
      p={ 5 }
    >
      <chakra.span
        display="block"
        fontWeight={ 600 }
        fontSize="xs"
        color="text.secondary"
        textTransform="uppercase"
        letterSpacing="wide"
        mb={ 2 }
      >
        { label }
      </chakra.span>
      <Skeleton loading={ isLoading } w="fit-content">
        <chakra.span
          fontSize="2xl"
          fontWeight={ 700 }
          color={ accent }
        >
          { value }
        </chakra.span>
      </Skeleton>
    </Box>
  );
}

function ConvergenceDot({ state, isLoading }: { state: string | undefined; isLoading: boolean }) {
  const color = state ? convergenceColor(state) : 'gray.300';
  return (
    <Flex alignItems="center" gap={ 2 }>
      <Box
        w={ 3 }
        h={ 3 }
        borderRadius="full"
        bg={ isLoading ? 'gray.300' : color }
        flexShrink={ 0 }
      />
      <Skeleton loading={ isLoading } w="fit-content">
        <chakra.span fontSize="2xl" fontWeight={ 700 } color={ isLoading ? undefined : color }>
          { state ?? '—' }
        </chakra.span>
      </Skeleton>
    </Flex>
  );
}

function ValidatorRow({
  report,
  isLoading,
}: {
  report: TemporalValidatorReport;
  isLoading: boolean;
}) {
  const repColor = reputationColor(report.reputation);
  const repPct = reputationToPercent(report.reputation);

  return (
    <TableRow>
      <TableCell>
        <Skeleton loading={ isLoading } w="fit-content">
          <chakra.span fontFamily="mono" fontSize="sm" color="#0078D4" fontWeight={ 600 }>
            #{ report.authority_index }
          </chakra.span>
        </Skeleton>
      </TableCell>
      <TableCell>
        <Skeleton loading={ isLoading } w="fit-content">
          <chakra.span fontFamily="mono" fontSize="sm">
            { formatOffsetNs(report.clock_offset_ns) }
          </chakra.span>
        </Skeleton>
      </TableCell>
      <TableCell>
        <Skeleton loading={ isLoading } w="fit-content">
          <chakra.span fontFamily="mono" fontSize="sm">
            { formatOffsetNs(report.root_distance_ns) }
          </chakra.span>
        </Skeleton>
      </TableCell>
      <TableCell>
        <Skeleton loading={ isLoading } w="fit-content">
          <Flex alignItems="center" gap={ 2 }>
            <Box w={ 2 } h={ 2 } borderRadius="full" bg={ repColor } flexShrink={ 0 }/>
            <chakra.span fontSize="sm" fontWeight={ 600 } color={ repColor }>
              { repPct }%
            </chakra.span>
          </Flex>
        </Skeleton>
      </TableCell>
      <TableCell>
        <Skeleton loading={ isLoading } w="fit-content">
          <chakra.span fontSize="sm">{ report.tier }</chakra.span>
        </Skeleton>
      </TableCell>
      <TableCell isNumeric>
        <Skeleton loading={ isLoading } w="fit-content" ml="auto">
          <chakra.span fontFamily="mono" fontSize="sm">
            { report.samples.toLocaleString() }
          </chakra.span>
        </Skeleton>
      </TableCell>
    </TableRow>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TemporalMesh = () => {
  const { data, isLoading } = useQuery<TemporalMeshState>({
    queryKey: [ 'temporal_mesh_state' ],
    queryFn: fetchTemporalMeshState,
    refetchInterval: REFETCH_INTERVAL_MS,
  });

  const meshDiameter = data?.mesh_diameter_ns != null
    ? formatOffsetNs(data.mesh_diameter_ns)
    : '—';

  return (
    <>
      <PageTitle
        title="Mesh Dashboard"
        secondRow={ (
          <chakra.span fontSize="sm" color="text.secondary">
            Live validator time mesh — nanosecond-precision temporal ordering
          </chakra.span>
        ) }
      />

      { /* ------------------------------------------------------------------ */ }
      { /* Overview section                                                    */ }
      { /* ------------------------------------------------------------------ */ }
      <chakra.span
        display="block"
        fontWeight={ 700 }
        fontSize="lg"
        mb={ 4 }
      >
        Mesh Overview
      </chakra.span>

      <Grid
        templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' }}
        gap={ 4 }
        mb={ 8 }
      >
        { /* Convergence — special: shows a coloured dot */ }
        <Box
          borderWidth="1px"
          borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
          borderRadius="xl"
          p={ 5 }
        >
          <chakra.span
            display="block"
            fontWeight={ 600 }
            fontSize="xs"
            color="text.secondary"
            textTransform="uppercase"
            letterSpacing="wide"
            mb={ 2 }
          >
            Convergence
          </chakra.span>
          <ConvergenceDot state={ data?.convergence_state } isLoading={ isLoading }/>
        </Box>

        <StatCard
          label="Mesh Quality"
          value={ data?.quality_percent != null ? `${ data.quality_percent }%` : '—' }
          isLoading={ isLoading }
          accent={ data?.quality_percent != null ? (
            data.quality_percent >= 90 ? 'green.500' :
            data.quality_percent >= 70 ? 'yellow.500' : 'red.500'
          ) : undefined }
        />

        <StatCard
          label="Mesh Diameter"
          value={ meshDiameter }
          isLoading={ isLoading }
        />

        <StatCard
          label="Peer Count"
          value={ data?.peer_count?.toLocaleString() ?? '—' }
          isLoading={ isLoading }
        />

        <StatCard
          label="Total Samples"
          value={ data?.total_samples?.toLocaleString() ?? '—' }
          isLoading={ isLoading }
        />
      </Grid>

      { /* ------------------------------------------------------------------ */ }
      { /* Validator table                                                     */ }
      { /* ------------------------------------------------------------------ */ }
      <chakra.span
        display="block"
        fontWeight={ 700 }
        fontSize="lg"
        mb={ 4 }
      >
        Validators
      </chakra.span>

      <Box
        borderWidth="1px"
        borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
        borderRadius="xl"
        overflow="hidden"
        mb={ 8 }
      >
        <TableRoot>
          <TableHeader>
            <TableRow>
              <TableColumnHeader>Validator</TableColumnHeader>
              <TableColumnHeader>Clock Offset</TableColumnHeader>
              <TableColumnHeader>Root Distance</TableColumnHeader>
              <TableColumnHeader>Reputation</TableColumnHeader>
              <TableColumnHeader>Tier</TableColumnHeader>
              <TableColumnHeader isNumeric>Samples</TableColumnHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            { isLoading && (
              // Skeleton rows while loading
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={ i }>
                  { Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={ j }>
                      <Skeleton loading h={ 4 } w={ j === 0 ? '60px' : '80px' }/>
                    </TableCell>
                  )) }
                </TableRow>
              ))
            ) }
            { !isLoading && (data?.validators ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={ 6 }>
                  <chakra.span fontSize="sm" color="text.secondary">
                    Validator data not yet available — mesh-state endpoint pending
                  </chakra.span>
                </TableCell>
              </TableRow>
            ) }
            { !isLoading && (data?.validators ?? []).map((v) => (
              <ValidatorRow
                key={ v.authority_index }
                report={ v }
                isLoading={ false }
              />
            )) }
          </TableBody>
        </TableRoot>
      </Box>

      { /* ------------------------------------------------------------------ */ }
      { /* Pairwise offsets table                                              */ }
      { /* ------------------------------------------------------------------ */ }
      <chakra.span
        display="block"
        fontWeight={ 700 }
        fontSize="lg"
        mb={ 4 }
      >
        Pairwise Offsets
      </chakra.span>

      <Box
        borderWidth="1px"
        borderColor={{ _light: 'gray.200', _dark: 'whiteAlpha.300' }}
        borderRadius="xl"
        overflow="hidden"
      >
        <TableRoot>
          <TableHeader>
            <TableRow>
              <TableColumnHeader>From</TableColumnHeader>
              <TableColumnHeader>To</TableColumnHeader>
              <TableColumnHeader isNumeric>Offset</TableColumnHeader>
            </TableRow>
          </TableHeader>
          <TableBody>
            { isLoading && (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={ i }>
                  { [ 60, 60, 80 ].map((w, j) => (
                    <TableCell key={ j }>
                      <Skeleton loading h={ 4 } w={ `${ w }px` }/>
                    </TableCell>
                  )) }
                </TableRow>
              ))
            ) }
            { !isLoading && (data?.pairwise_offsets ?? []).length === 0 && (
              <TableRow>
                <TableCell colSpan={ 3 }>
                  <chakra.span fontSize="sm" color="text.secondary">
                    Pairwise offset data not yet available
                  </chakra.span>
                </TableCell>
              </TableRow>
            ) }
            { !isLoading && (data?.pairwise_offsets ?? []).map((p, i) => (
              <TableRow key={ i }>
                <TableCell>
                  <chakra.span fontFamily="mono" fontSize="sm" color="#0078D4" fontWeight={ 600 }>
                    #{ p.from_index }
                  </chakra.span>
                </TableCell>
                <TableCell>
                  <chakra.span fontFamily="mono" fontSize="sm" color="#0078D4" fontWeight={ 600 }>
                    #{ p.to_index }
                  </chakra.span>
                </TableCell>
                <TableCell isNumeric>
                  <chakra.span fontFamily="mono" fontSize="sm">
                    { formatOffsetNs(p.offset_ns) }
                  </chakra.span>
                </TableCell>
              </TableRow>
            )) }
          </TableBody>
        </TableRoot>
      </Box>
    </>
  );
};

export default TemporalMesh;
