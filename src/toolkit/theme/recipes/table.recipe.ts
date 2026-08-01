// SPDX-License-Identifier: LicenseRef-Blockscout

import { defineSlotRecipe } from '@chakra-ui/react';

export const recipe = defineSlotRecipe({
  slots: [ 'root', 'row', 'cell', 'columnHeader', 'caption', 'footer', 'body', 'header' ],
  base: {
    root: {
      tableLayout: 'fixed',
      fontVariant: 'normal',
      fontVariantLigatures: 'no-contextual',
      borderCollapse: 'collapse',
      width: 'full',
      textAlign: 'start',
      verticalAlign: 'top',
      overflow: 'unset',
      fontFamily: 'body',
      fontVariantNumeric: 'tabular-nums',
    },
    cell: {
      textAlign: 'start',
      alignItems: 'center',
      verticalAlign: 'top',
      fontWeight: 'normal',
    },
    columnHeader: {
      fontFamily: 'heading',
      fontWeight: '600',
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      textAlign: 'start',
    },
  },

  variants: {
    variant: {
      line: {
        columnHeader: {
          color: 'table.header.fg',
          backgroundColor: 'table.header.bg',
          borderTopWidth: '1px',
          borderBottomWidth: '1px',
          borderColor: 'border.divider',
          _first: {
            borderTopLeftRadius: 'base',
          },
          _last: {
            borderTopRightRadius: 'base',
          },
        },
        cell: {
          borderBottomWidth: '1px',
          borderColor: 'border.divider',
        },
        row: {
          bg: 'bg.primary',
        },
      },
    },

    size: {
      md: {
        root: {
          fontSize: 'sm',
        },
        columnHeader: {
          px: '6px',
          py: '10px',
          _first: {
            pl: 3,
          },
          _last: {
            pr: 3,
          },
        },
        cell: {
          px: '6px',
          py: { base: 2, lg: 4 },
          _first: {
            pl: 3,
          },
          _last: {
            pr: 3,
          },
        },
      },
    },
  },

  defaultVariants: {
    variant: 'line',
    size: 'md',
  },
});
