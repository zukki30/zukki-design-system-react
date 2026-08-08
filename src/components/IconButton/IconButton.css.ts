import { interactiveTouch } from '@/styles/interactive';
import { reducedMotionNone } from '@/styles/motion';
import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

export const iconButtonSize = styleVariants({
  sm: {
    padding: vars.spacing.sm,
    borderRadius: vars['border-radius'].sm,
  },
  md: {
    padding: vars.spacing.md,
    borderRadius: vars['border-radius'].md,
  },
});

export const iconButtonVariant = styleVariants({
  primary: {
    backgroundColor: vars.color.primary.default,
    color: vars.color.textOnDark.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.primary.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.primary.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.primary.disabled,
      },
    },
  },
  secondary: {
    backgroundColor: vars.color.secondary.default,
    color: vars.color.textOnDark.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.secondary.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.secondary.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.secondary.disabled,
      },
    },
  },
  'primary-exposed': {
    backgroundColor: vars.color.exposed.default,
    color: vars.color.primary.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.exposed.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.exposed.selected,
      },
      '&:disabled': {
        backgroundColor: vars.color.exposed.default,
        color: vars.color.primary.disabled,
      },
    },
  },
  'secondary-exposed': {
    backgroundColor: vars.color.exposed.default,
    color: vars.color.grey[500],

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.exposed.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.exposed.selected,
      },
      '&:disabled': {
        backgroundColor: vars.color.exposed.default,
        color: vars.color.grey[300],
      },
    },
  },
});

export const iconButton = style({
  position: 'relative',
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 0,
  cursor: 'pointer',
  lineHeight: 0,
  transition:
    'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out',
  ...reducedMotionNone,
  ...interactiveTouch,

  selectors: {
    '&:focus-visible': {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing['2xs'],
    },
    '&[data-selected="true"]': {
      pointerEvents: 'none',
    },
    '&:disabled': {
      pointerEvents: 'none',
    },
    '&[data-loading="true"]': {
      pointerEvents: 'none',
    },
  },
});

export const iconButtonInner = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',

  selectors: {
    // Button と違い visibility: hidden のままでよい。IconButton のアクセシブルネームは
    // 必須の aria-label 由来なので、children がツリーから外れても名前は失われない
    '&[data-loading="true"]': {
      visibility: 'hidden',
    },
  },
});

export const iconButtonLoading = style({
  position: 'absolute',
  inset: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});
