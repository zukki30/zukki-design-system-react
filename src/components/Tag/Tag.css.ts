import { interactiveTouch } from '@/styles/interactive';
import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

export const tag = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.spacing.xs,
  padding: vars.spacing.xs,
  borderRadius: vars['border-radius'].sm,
  borderWidth: 1,
  borderStyle: 'solid',
  fontFamily: vars['font-family'].default,
  fontSize: vars['font-size'].xs,
  fontWeight: vars['font-weight'].normal,
  lineHeight: vars['line-height'].line,
});

export const tagVariant = styleVariants({
  default: {
    borderColor: vars.color.grey[200],
    backgroundColor: vars.color.grey[50],
    color: vars.color.grey[700],
  },
  red: {
    borderColor: vars.color.red[200],
    backgroundColor: vars.color.red[50],
    color: vars.color.red[300],
  },
  blue: {
    borderColor: vars.color.blue[200],
    backgroundColor: vars.color.blue[0],
    color: vars.color.blue[500],
  },
  green: {
    borderColor: vars.color.green[200],
    backgroundColor: vars.color.green[0],
    color: vars.color.green[500],
  },
  yellow: {
    borderColor: vars.color.yellow[300],
    backgroundColor: vars.color.yellow[50],
    color: vars.color.yellow[600],
  },
  profile: {
    borderColor: vars.color.emerald[300],
    backgroundColor: vars.color.emerald[50],
    color: vars.color.emerald[600],
  },
  works: {
    borderColor: vars.color.teal[300],
    backgroundColor: vars.color.teal[50],
    color: vars.color.teal[600],
  },
  outputs: {
    borderColor: vars.color.sky[300],
    backgroundColor: vars.color.sky[50],
    color: vars.color.sky[600],
  },
});

export const tagCloseButton = style({
  padding: vars.spacing.none,
  width: 14,
  height: 14,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: vars['line-height'].line,
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  ...interactiveTouch,

  selectors: {
    // ネイティブのタップハイライトを消すぶん、フォーカス時の視覚フィードバックを Button / IconButton と揃える
    '&:focus-visible': {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing['2xs'],
    },
  },
});

export const tagCloseButtonVariant = styleVariants({
  default: {
    color: vars.color.grey[500],
    ':hover': {
      color: vars.color.grey[700],
    },
  },
  red: {
    color: vars.color.red[300],
    ':hover': {
      color: vars.color.red[500],
    },
  },
  blue: {
    color: vars.color.blue[300],
    ':hover': {
      color: vars.color.blue[500],
    },
  },
  green: {
    color: vars.color.green[300],
    ':hover': {
      color: vars.color.green[500],
    },
  },
  yellow: {
    color: vars.color.yellow[300],
    ':hover': {
      color: vars.color.yellow[600],
    },
  },
  profile: {
    color: vars.color.emerald[300],
    ':hover': {
      color: vars.color.emerald[600],
    },
  },
  works: {
    color: vars.color.teal[300],
    ':hover': {
      color: vars.color.teal[600],
    },
  },
  outputs: {
    color: vars.color.sky[300],
    ':hover': {
      color: vars.color.sky[600],
    },
  },
});
