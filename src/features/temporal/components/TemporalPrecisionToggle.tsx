// SPDX-License-Identifier: LicenseRef-Blockscout

import type { StackProps } from '@chakra-ui/react';
import { HStack, chakra } from '@chakra-ui/react';
import React from 'react';

import { useSettingsContext } from 'src/shell/top-bar/settings/context';

import { IconButton } from 'src/toolkit/chakra/icon-button';
import { Tooltip } from 'src/toolkit/chakra/tooltip';

interface Props extends StackProps {}

const TemporalPrecisionToggle = (props: Props) => {
  const settings = useSettingsContext();
  const showNanoseconds = settings?.showNanoseconds ?? true;
  const label = showNanoseconds ? 'Hide fractional nanoseconds' : 'Show fractional nanoseconds';

  return (
    <HStack display="inline-flex" gap={ 1 } ml={ 1 } verticalAlign="bottom" { ...props }>
      <Tooltip content={ label }>
        <IconButton
          aria-label={ label }
          variant="icon_secondary"
          onClick={ settings?.toggleShowNanoseconds }
          boxSize={ 5 }
          selected={ showNanoseconds }
          borderRadius="sm"
          verticalAlign="bottom"
        >
          <chakra.span fontSize="9px" fontFamily="mono" fontWeight={ 700 }>.ns</chakra.span>
        </IconButton>
      </Tooltip>
    </HStack>
  );
};

export default React.memo(TemporalPrecisionToggle);
