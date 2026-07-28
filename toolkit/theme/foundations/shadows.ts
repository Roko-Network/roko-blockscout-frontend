import type { ThemingConfig } from '@chakra-ui/react';

import type { ExcludeUndefined } from 'types/utils';

const shadows: ExcludeUndefined<ThemingConfig['tokens']>['shadows'] = {
  // ROKO surfaces are separated by line and tone, never elevation effects.
  action_bar: { value: 'none' },
  size: {
    xs: { value: 'none' },
    sm: { value: 'none' },
    base: { value: 'none' },
    md: { value: 'none' },
    lg: { value: 'none' },
    xl: { value: 'none' },
    '2xl': { value: 'none' },
  },
  'dark-lg': { value: 'none' },
};

export default shadows;
