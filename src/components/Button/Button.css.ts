import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

export const buttonSize = styleVariants({
  sm: {
    paddingInline: vars.spacing['2xl'],
    borderRadius: vars['border-radius'].sm,

    selectors: {
      '&[data-has-start-icon="true"]': {
        paddingInlineStart: vars.spacing.xl,
      },
      '&[data-has-end-icon="true"]': {
        paddingInlineEnd: vars.spacing.xl,
      },
    },
  },
  md: {
    paddingInline: vars.spacing['3xl'],
    borderRadius: vars['border-radius'].md,

    selectors: {
      '&[data-has-start-icon="true"]': {
        paddingInlineStart: vars.spacing['2xl'],
      },
      '&[data-has-end-icon="true"]': {
        paddingInlineEnd: vars.spacing['2xl'],
      },
    },
  },
});

export const buttonVariant = styleVariants({
  default: {
    backgroundColor: vars.color.default.default,
    borderColor: vars.color.default.subtle,
    color: vars.color.textOnLight.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.default.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.default.seleted,
        borderColor: vars.color.default.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.default.default,
        borderColor: vars.color.default.disabled,
        color: vars.color.textOnLight.disabled,
      },
    },
  },
  primary: {
    backgroundColor: vars.color.primary.default,
    borderColor: vars.color.primary.default,
    color: vars.color.textOnDark.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.primary.hover,
        borderColor: vars.color.primary.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.primary.seleted,
        borderColor: vars.color.primary.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.primary.disabled,
        borderColor: vars.color.primary.disabled,
      },
    },
  },
  secondary: {
    backgroundColor: vars.color.secondary.default,
    borderColor: vars.color.secondary.default,
    color: vars.color.textOnDark.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.secondary.hover,
        borderColor: vars.color.secondary.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.secondary.seleted,
        borderColor: vars.color.secondary.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.secondary.disabled,
        borderColor: vars.color.secondary.disabled,
      },
    },
  },
  success: {
    backgroundColor: vars.color.success.default,
    borderColor: vars.color.success.default,
    color: vars.color.textOnDark.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.success.hover,
        borderColor: vars.color.success.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.success.seleted,
        borderColor: vars.color.success.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.success.disabled,
        borderColor: vars.color.success.disabled,
      },
    },
  },
  failure: {
    backgroundColor: vars.color.failure.default,
    borderColor: vars.color.failure.default,
    color: vars.color.textOnDark.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.failure.hover,
        borderColor: vars.color.failure.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.failure.seleted,
        borderColor: vars.color.failure.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.failure.disabled,
        borderColor: vars.color.failure.disabled,
      },
    },
  },
  profile: {
    backgroundColor: vars.color.profile.default,
    borderColor: vars.color.profile.default,
    color: vars.color.textOnDark.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.profile.hover,
        borderColor: vars.color.profile.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.profile.seleted,
        borderColor: vars.color.profile.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.profile.disabled,
        borderColor: vars.color.profile.disabled,
      },
    },
  },
  works: {
    backgroundColor: vars.color.works.default,
    borderColor: vars.color.works.default,
    color: vars.color.textOnDark.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.works.hover,
        borderColor: vars.color.works.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.works.seleted,
        borderColor: vars.color.works.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.works.disabled,
        borderColor: vars.color.works.disabled,
      },
    },
  },
  outputs: {
    backgroundColor: vars.color.outputs.default,
    borderColor: vars.color.outputs.default,
    color: vars.color.textOnDark.default,

    selectors: {
      '&:hover': {
        backgroundColor: vars.color.outputs.hover,
        borderColor: vars.color.outputs.hover,
      },
      '&[data-selected="true"]': {
        backgroundColor: vars.color.outputs.seleted,
        borderColor: vars.color.outputs.seleted,
      },
      '&:disabled': {
        backgroundColor: vars.color.outputs.disabled,
        borderColor: vars.color.outputs.disabled,
      },
    },
  },
});

export const button = style({
  position: 'relative',
  boxSizing: 'border-box',
  paddingBlock: vars.spacing.none,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  borderStyle: 'solid',
  cursor: 'pointer',
  lineHeight: 0,
  transition:
    'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out',

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

export const buttonInner = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: 0,
  gap: vars.spacing.sm,

  selectors: {
    '&[data-loading="true"]': {
      visibility: 'hidden',
    },
  },
});

const buttonLabelBase = style({
  marginBlock: vars['leading-trim'],
  boxSizing: 'border-box',
  display: 'flex',
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].bold,
  lineHeight: vars['line-height'].line,
});

export const buttonLabel = styleVariants({
  sm: [
    buttonLabelBase,
    {
      paddingBlockStart: vars.spacing.lg,
      paddingBlockEnd: vars.spacing.md,
      fontSize: vars['font-size'].xs,
    },
  ],
  md: [
    buttonLabelBase,
    {
      paddingBlockStart: vars.spacing.xl,
      paddingBlockEnd: vars.spacing.lg,
      fontSize: vars['font-size'].sm,
    },
  ],
});

export const buttonLoading = style({
  position: 'absolute',
  inset: 0,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
});
