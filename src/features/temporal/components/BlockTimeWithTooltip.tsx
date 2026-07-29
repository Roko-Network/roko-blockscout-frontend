// SPDX-License-Identifier: LicenseRef-Blockscout

import { chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import type { TimeFormat } from 'src/shell/top-bar/settings/time-format/utils';

import { fetchTemporalBlockMetadata } from 'src/features/temporal/api/temporal-rpc';
import NanoTimeWithTooltip from 'src/features/temporal/components/NanoTimeWithTooltip';

import TimeWithTooltip from 'src/shared/date-and-time/TimeWithTooltip';

interface Props {
  blockNumber: number;
  timestamp?: string | number | null;
  timestampNs?: string | null;
  isLoading?: boolean;
  enableIncrement?: boolean;
  timeFormat?: TimeFormat;
  className?: string;
}

const BlockTimeWithTooltip = ({
  blockNumber,
  timestamp,
  timestampNs,
  isLoading,
  enableIncrement,
  timeFormat,
  className,
}: Props) => {
  const { data: temporalMetadata } = useQuery({
    queryKey: [ 'temporal_block_metadata', blockNumber ],
    queryFn: () => fetchTemporalBlockMetadata(blockNumber),
    enabled: timestampNs === undefined && !isLoading,
    retry: false,
    staleTime: Infinity,
  });
  const resolvedTimestampNs = timestampNs ?? temporalMetadata?.block_nano_timestamp;

  return resolvedTimestampNs ? (
    <NanoTimeWithTooltip
      timestampNs={ resolvedTimestampNs }
      enableIncrement={ enableIncrement }
      timeFormat={ timeFormat }
      className={ className }
    />
  ) : (
    <TimeWithTooltip
      timestamp={ timestamp }
      enableIncrement={ enableIncrement }
      timeFormat={ timeFormat }
      isLoading={ isLoading }
      className={ className }
    />
  );
};

export default chakra(BlockTimeWithTooltip);
