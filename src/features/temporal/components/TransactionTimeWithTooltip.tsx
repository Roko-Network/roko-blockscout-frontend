// SPDX-License-Identifier: LicenseRef-Blockscout

import { chakra } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import type { TimeFormat } from 'src/shell/top-bar/settings/time-format/utils';

import { fetchTemporalTxTimestamp } from 'src/features/temporal/api/temporal-rpc';
import NanoTimeWithTooltip from 'src/features/temporal/components/NanoTimeWithTooltip';

import TimeWithTooltip from 'src/shared/date-and-time/TimeWithTooltip';

interface Props {
  txHash: string;
  timestamp?: string | number | null;
  timestampNs?: string | null;
  isLoading?: boolean;
  enableIncrement?: boolean;
  timeFormat?: TimeFormat;
  className?: string;
}

const TransactionTimeWithTooltip = ({
  txHash,
  timestamp,
  timestampNs,
  isLoading,
  enableIncrement,
  timeFormat,
  className,
}: Props) => {
  const { data: temporalTimestamp } = useQuery({
    queryKey: [ 'temporal_tx_timestamp', txHash ],
    queryFn: () => fetchTemporalTxTimestamp(txHash),
    enabled: Boolean(txHash) && timestampNs === undefined && !isLoading,
    retry: false,
    staleTime: Infinity,
  });
  const resolvedTimestampNs = timestampNs ?? temporalTimestamp?.timestamp_ns;

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

export default chakra(TransactionTimeWithTooltip);
