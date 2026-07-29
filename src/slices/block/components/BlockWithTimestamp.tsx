// SPDX-License-Identifier: LicenseRef-Blockscout

import { Flex } from '@chakra-ui/react';
import React from 'react';

import type { TimeFormat } from 'src/shell/top-bar/settings/time-format/utils';

import TransactionTimeWithTooltip from 'src/features/temporal/components/TransactionTimeWithTooltip';

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
      { txHash ? (
        <TransactionTimeWithTooltip
          txHash={ txHash }
          timestamp={ timestamp }
          timestampNs={ timestampNs }
          enableIncrement={ enableTimeIncrement }
          timeFormat={ timeFormat }
          isLoading={ isLoading }
          color="text.secondary"
          fontSize="sm"
          whiteSpace="nowrap"
        />
      ) : (
        <TransactionTimeWithTooltip
          txHash=""
          timestamp={ timestamp }
          timestampNs={ timestampNs ?? null }
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
