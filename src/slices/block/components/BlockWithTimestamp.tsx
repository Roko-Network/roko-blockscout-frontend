// SPDX-License-Identifier: LicenseRef-Blockscout

import { Flex } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import React from 'react';

import type { TimeFormat } from 'src/shell/top-bar/settings/time-format/utils';

import { fetchTemporalTxTimestamp } from 'src/features/temporal/api/temporal-rpc';
import NanoTimeWithTooltip from 'src/features/temporal/components/NanoTimeWithTooltip';

import TimeWithTooltip from 'src/shared/date-and-time/TimeWithTooltip';

import BlockEntity from './entity/BlockEntity';

interface Props {
  number: number | string;
  timestamp?: string | number | null;
  timestampNs?: string | null;
  txHash?: string | null;
  isLoading?: boolean;
  enableTimeIncrement?: boolean;
  timeFormat?: TimeFormat;
  layout?: 'horizontal' | 'vertical';
  fontWeight?: number | string;
  isPendingUpdate?: boolean;
}

const BlockWithTimestamp = ({
  number,
  timestamp,
  timestampNs,
  txHash,
  isLoading,
  enableTimeIncrement,
  timeFormat,
  layout = 'vertical',
  fontWeight = 500,
  isPendingUpdate,
}: Props) => {
  const horizontal = layout === 'horizontal';
  const { data: temporalTimestamp } = useQuery({
    queryKey: [ 'temporal_tx_timestamp', txHash ],
    queryFn: () => fetchTemporalTxTimestamp(txHash as string),
    enabled: Boolean(txHash) && timestampNs === undefined,
    retry: false,
    staleTime: Infinity,
  });
  const resolvedTimestampNs = timestampNs ?? temporalTimestamp?.timestamp_ns;

  return (
    <Flex
      direction={ horizontal ? 'row' : 'column' }
      alignItems={ horizontal ? 'center' : 'flex-start' }
      columnGap={ 2 }
      rowGap={ 1 }
      minW={ 0 }
    >
      <BlockEntity
        number={ number }
        isLoading={ isLoading }
        isPendingUpdate={ isPendingUpdate }
        noIcon
        textStyle="sm"
        fontWeight={ fontWeight }
      />
      { resolvedTimestampNs ? (
        <NanoTimeWithTooltip
          timestampNs={ resolvedTimestampNs }
          enableIncrement={ enableTimeIncrement }
          timeFormat={ timeFormat }
          color="text.secondary"
          fontSize="sm"
          whiteSpace="nowrap"
        />
      ) : (
        <TimeWithTooltip
          timestamp={ timestamp }
          enableIncrement={ enableTimeIncrement }
          timeFormat={ timeFormat }
          isLoading={ isLoading }
          color="text.secondary"
          fontSize="sm"
          whiteSpace="nowrap"
        />
      ) }
    </Flex>
  );
};

export default React.memo(BlockWithTimestamp);
