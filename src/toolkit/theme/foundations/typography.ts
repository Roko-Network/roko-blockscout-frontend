// SPDX-License-Identifier: LicenseRef-Blockscout

import type { ThemingConfig } from '@chakra-ui/react';

import type { ExcludeUndefined } from 'src/shared/types/utils';

import config from 'src/config';

export const BODY_TYPEFACE = config.misc.fonts.body?.name ??
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI"';
export const HEADING_TYPEFACE = config.misc.fonts.heading?.name ?? 'Rajdhani';

export const fonts: ExcludeUndefined<ThemingConfig['tokens']>['fonts'] = {
  heading: { value: `${ HEADING_TYPEFACE }, sans-serif` },
  body: { value: `${ BODY_TYPEFACE }, sans-serif` },
  mono: { value: '"JetBrains Mono", "SFMono-Regular", Consolas, monospace' },
};

export const textStyles: ThemingConfig['textStyles'] = {
  heading: {
    xl: {
      value: {
        fontSize: '32px',
        lineHeight: '36px',
        fontWeight: '700',
        letterSpacing: '-0.64px',
        fontFamily: 'heading',
      },
    },
    lg: {
      value: {
        fontSize: '24px',
        lineHeight: '30px',
        fontWeight: '700',
        letterSpacing: '-0.24px',
        fontFamily: 'heading',
      },
    },
    md: {
      value: {
        fontSize: '18px',
        lineHeight: '24px',
        fontWeight: '600',
        letterSpacing: '-0.18px',
        fontFamily: 'heading',
      },
    },
    sm: {
      value: {
        fontSize: '16px',
        lineHeight: '22px',
        fontWeight: '600',
        letterSpacing: '0.16px',
        fontFamily: 'heading',
      },
    },
    xs: {
      value: {
        fontSize: '14px',
        lineHeight: '20px',
        fontWeight: '600',
        letterSpacing: '0.42px',
        fontFamily: 'heading',
      },
    },
  },
  text: {
    xl: {
      value: {
        fontSize: '20px',
        lineHeight: '28px',
        fontWeight: '400',
        fontFamily: 'body',
      },
    },
    md: {
      value: {
        fontSize: '16px',
        lineHeight: '24px',
        fontWeight: '400',
        fontFamily: 'body',
      },
    },
    sm: {
      value: {
        fontSize: '14px',
        lineHeight: '20px',
        fontWeight: '400',
        fontFamily: 'body',
      },
    },
    xs: {
      value: {
        fontSize: '12px',
        lineHeight: '16px',
        fontWeight: '400',
        fontFamily: 'body',
      },
    },
  },
};
