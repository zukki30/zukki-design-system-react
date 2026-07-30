import { reducedMotionNone } from '@/styles/motion';
import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

export const input = style({
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  width: '100%',
  backgroundColor: vars.color.input.background.default,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: vars.color.input.border.default,
  borderRadius: vars['border-radius'].lg,
  transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
  ...reducedMotionNone,

  selectors: {
    '&:hover:not([data-disabled="true"]):not([data-error="true"])': {
      borderColor: vars.color.input.border.hover,
    },
    '&:focus-within': {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing.xs,
    },
    '&[data-error="true"]': {
      backgroundColor: vars.color.input.background.error,
      borderColor: vars.color.input.border.error,
    },
    '&[data-error="true"]:hover:not([data-disabled="true"])': {
      borderColor: vars.color.input.border['error hover'],
    },
    '&[data-disabled="true"]': {
      backgroundColor: vars.color.input.background.disabled,
      borderColor: vars.color.input.border.disabled,
    },
  },
});

export const inputField = style({
  flex: '1 0 0',
  minWidth: 0,
  boxSizing: 'border-box',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  paddingInline: vars.spacing.sm,
  paddingBlock: vars.spacing.md,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].line,
  color: vars.color.textOnLight.default,

  selectors: {
    '&::placeholder': {
      color: vars.color.textOnLight.placeholder,
    },
    '&:disabled': {
      color: vars.color.textOnLight.disabled,
      WebkitTextFillColor: vars.color.textOnLight.disabled,
      cursor: 'not-allowed',
    },
  },
});

export const inputIcon = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  lineHeight: 0,
  color: vars.color.textOnLight.subtle,

  selectors: {
    '&[data-position="start"]': {
      paddingInlineStart: vars.spacing.sm,
    },
    '&[data-position="end"]': {
      paddingInlineEnd: vars.spacing.sm,
    },
    '[data-disabled="true"] &': {
      color: vars.color.textOnLight.disabled,
    },
  },
});
