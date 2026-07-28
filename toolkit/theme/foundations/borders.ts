import type { ThemingConfig } from '@chakra-ui/react';

import type { ExcludeUndefined } from 'types/utils';

export const radii: ExcludeUndefined<ThemingConfig['tokens']>['radii'] = {
  none: { value: '0' },
  sm: { value: '2px' },
  base: { value: '8px' },
  md: { value: '8px' },
  lg: { value: '8px' },
  xl: { value: '12px' },
  full: { value: '9999px' },
};
