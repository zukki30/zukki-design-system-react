import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

export const card = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  overflow: 'hidden',
  backgroundColor: vars.color.grey['0'],
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: vars.color.grey['50'],
  borderRadius: vars['border-radius'].lg,
});

export const cardImage = style({
  display: 'block',
  width: '100%',
  flexShrink: 0,
});

export const cardHeader = style({
  boxSizing: 'border-box',
  display: 'flex',
  gap: vars.spacing.sm,
  alignItems: 'center',
  width: '100%',
  flexShrink: 0,
  paddingBottom: vars.spacing.none,

  selectors: {
    '[data-size="md"] &': {
      paddingTop: vars.spacing['2xl'],
      paddingInline: vars.spacing['2xl'],
    },
    '[data-size="sm"] &': {
      paddingTop: vars.spacing.xl,
      paddingInline: vars.spacing.xl,
    },
  },
});

export const cardTitle = style({
  // 長いタイトルは action を押し出さず 1 行で省略する。
  // cardHeaderMeta が flex-shrink: 0 なので、縮む余地はこちらに寄る
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].bold,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].heading,
  color: vars.color.textOnLight.default,
});

export const cardHeaderMeta = style({
  display: 'flex',
  flex: '1 0 0',
  minWidth: 0,
  alignItems: 'center',
  justifyContent: 'flex-end',
});

export const cardBody = style({
  boxSizing: 'border-box',
  display: 'flex',
  width: '100%',
  flexShrink: 0,
  // 本文は省略せず折り返す。URL のような分割できない長い語も
  // カード幅で折り返して card の overflow: hidden で切られないようにする
  minWidth: 0,
  overflowWrap: 'anywhere',
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].default,
  color: vars.color.textOnLight.default,

  selectors: {
    '[data-size="md"] &': {
      padding: vars.spacing['2xl'],
    },
    '[data-size="sm"] &': {
      padding: vars.spacing.xl,
    },
  },
});

export const cardFooter = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  flexShrink: 0,
  paddingTop: vars.spacing.none,

  selectors: {
    '[data-size="md"] &': {
      paddingBottom: vars.spacing['2xl'],
      paddingInline: vars.spacing['2xl'],
    },
    '[data-size="sm"] &': {
      paddingBottom: vars.spacing.xl,
      paddingInline: vars.spacing.xl,
    },
  },
});
