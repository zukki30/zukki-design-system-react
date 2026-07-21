import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

export const formField = style({
  display: 'flex',
  gap: vars.spacing.sm,
  alignItems: 'flex-start',

  selectors: {
    '&[data-orientation="vertical"]': {
      flexDirection: 'column',
    },
  },
});

export const formFieldLabelContainer = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  flexShrink: 0,

  selectors: {
    '[data-orientation="horizontal"] &': {
      width: 100,
    },
  },
});

export const formFieldLabel = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.spacing.sm,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].heading,
  color: vars.color.textOnLight.default,

  selectors: {
    // 横並びのときは入力欄の上下パディングに合わせてラベルを下げる
    '[data-orientation="horizontal"] &': {
      paddingTop: vars.spacing.md,
    },
    '[data-disabled="true"] &': {
      color: vars.color.textOnLight.disabled,
    },
  },
});

export const formFieldRequiredAsterisk = style({
  flexShrink: 0,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].heading,
  color: vars.color.red['400'],
});

export const formFieldRequiredBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  paddingInline: vars.spacing.xs,
  paddingBlock: vars.spacing['2xs'],
  borderRadius: vars['border-radius'].xs,
  backgroundColor: vars.color.red['400'],
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].bold,
  fontSize: vars['font-size']['2xs'],
  lineHeight: vars['line-height'].line,
  color: vars.color.white,
  whiteSpace: 'nowrap',
});

export const formFieldControl = style({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  gap: vars.spacing.sm,
  flex: '1 0 0',
  minWidth: 0,
});

export const formFieldHelperText = style({
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].xs,
  lineHeight: vars['line-height'].default,
  color: vars.color.grey['400'],
});

export const formFieldErrorText = style({
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].xs,
  lineHeight: vars['line-height'].default,
  color: vars.color.textOnFailure.default,
});
