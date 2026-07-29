// SPDX-License-Identifier: LicenseRef-Blockscout

import { chakra } from '@chakra-ui/react';
import React from 'react';

import { useSettingsContext } from 'src/shell/top-bar/settings/context';
import type { TimeFormat } from 'src/shell/top-bar/settings/time-format/utils';

import { formatNanoTimestamp, nanoToDatetime } from 'src/features/temporal/utils/formatNanoTimestamp';

import useTimeAgoIncrement from 'src/shared/date-and-time/useTimeAgoIncrement';

import { Tooltip } from 'src/toolkit/chakra/tooltip';

interface Props {
  timestampNs: string;
  enableIncrement?: boolean;
  timeFormat?: TimeFormat;
  className?: string;
}

const NanoTimeWithTooltip = ({ timestampNs, enableIncrement, timeFormat: timeFormatProp, className }: Props) => {
  const settings = useSettingsContext();
  const timeFormat = timeFormatProp || settings?.timeFormat || 'relative';
  const timestamp = nanoToDatetime(timestampNs);
  const timeAgo = useTimeAgoIncrement(timestamp, enableIncrement && timeFormat === 'relative');
  const exactTime = formatNanoTimestamp(timestampNs, {
    includeFraction: settings?.showNanoseconds ?? true,
    isLocalTime: settings?.isLocalTime,
  });
  const fullPrecisionTime = formatNanoTimestamp(timestampNs, {
    includeFraction: true,
    isLocalTime: settings?.isLocalTime,
  });

  return (
    <Tooltip content={ timeFormat === 'relative' ? fullPrecisionTime : timeAgo }>
      <chakra.span className={ className } fontFamily={ timeFormat === 'absolute' ? 'mono' : undefined }>
        { timeFormat === 'relative' ? timeAgo : exactTime }
      </chakra.span>
    </Tooltip>
  );
};

export default chakra(NanoTimeWithTooltip);
