import type { SystemConfig } from '@chakra-ui/react';

import addressEntity from './globals/address-entity';
import entity from './globals/entity';
import recaptcha from './globals/recaptcha';
import scrollbar from './globals/scrollbar';

const webkitAutofillOverrides = {
  WebkitTextFillColor: 'var(--chakra-colors-input-fg)',
  '-webkit-box-shadow': '0 0 0px 1000px var(--chakra-colors-input-bg) inset',
  transition: 'background-color 5000s ease-in-out 0s',
};

const webkitAutofillRules = {
  '&:-webkit-autofill': webkitAutofillOverrides,
  '&:-webkit-autofill:hover': webkitAutofillOverrides,
  '&:-webkit-autofill:focus': webkitAutofillOverrides,
};

const globalCss: SystemConfig['globalCss'] = {
  html: {
    bg: 'global.body.bg',
    color: 'global.body.fg',
    scrollBehavior: 'smooth',
  },
  body: {
    bg: 'global.body.bg',
    color: 'global.body.fg',
    WebkitTapHighlightColor: 'transparent',
    fontVariantLigatures: 'no-contextual',
    focusRingStyle: 'hidden',
    lineHeight: '1.6',
    transitionProperty: 'background-color, color',
    transitionDuration: 'normal',
  },
  'h1, h2, h3, h4, h5, h6': {
    color: 'heading',
    fontFamily: 'heading',
    fontWeight: '700',
    letterSpacing: '-0.01em',
  },
  'code, kbd, pre, samp': {
    fontFamily: 'mono',
    fontVariantLigatures: 'none',
  },
  'button, [role="button"], a, input, textarea, select': {
    transitionProperty: 'background-color, border-color, color, opacity, transform',
    transitionDuration: 'fast',
  },
  ':where(a, button, input, textarea, select, [role="button"], [tabindex]):focus-visible': {
    outline: '2px solid',
    outlineColor: 'focus.ring',
    outlineOffset: '2px',
  },
  hr: {
    borderColor: 'border.divider',
  },
  mark: {
    bg: 'global.mark.bg',
    color: 'inherit',
  },
  '::selection': {
    bg: 'global.selection.bg',
  },
  'svg *::selection': {
    color: 'none',
    background: 'none',
  },
  form: {
    w: '100%',
  },
  input: {
    // hide number input arrows in Google Chrome
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    ...webkitAutofillRules,
  },
  textarea: {
    ...webkitAutofillRules,
  },
  select: {
    ...webkitAutofillRules,
  },
  ...recaptcha,
  ...scrollbar,
  ...entity,
  ...addressEntity,
};

export default globalCss;
