import { truncate } from '@/styles/text';
import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

export const card = style({
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'stretch',
  overflow: 'hidden',
  backgroundColor: vars.color.surface.raised,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: vars.color.surface.subtle,
  borderRadius: vars['border-radius'].lg,
});

export const cardImage = style({
  display: 'block',
  width: '100%',
  flexShrink: 0,
});

const cardHeaderBase = style({
  boxSizing: 'border-box',
  display: 'flex',
  gap: vars.spacing.sm,
  alignItems: 'center',
  width: '100%',
  flexShrink: 0,
  paddingBottom: vars.spacing.none,
});

export const cardHeader = styleVariants({
  md: [
    cardHeaderBase,
    {
      paddingTop: vars.spacing['2xl'],
      paddingInline: vars.spacing['2xl'],
    },
  ],
  sm: [
    cardHeaderBase,
    {
      paddingTop: vars.spacing.xl,
      paddingInline: vars.spacing.xl,
    },
  ],
});

export const cardTitle = style({
  // 長いタイトルは action を押し出さず 1 行で省略する。
  // cardAction が flex-shrink: 0 なので、縮む余地はこちらに寄る
  ...truncate,
  // level 指定時は h2〜h6 として描画されるため、UA 既定の余白を打ち消す
  margin: 0,
  flex: '1 1 auto',
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].bold,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].heading,
  color: vars.color.textOnSurface.default,
});

export const cardAction = style({
  display: 'flex',
  flex: '0 0 auto',
  alignItems: 'center',
  // タイトルの有無にかかわらずヘッダーの右端に寄せる
  marginInlineStart: 'auto',
});

const cardBodyBase = style({
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
  color: vars.color.textOnSurface.default,
});

export const cardBody = styleVariants({
  md: [cardBodyBase, { padding: vars.spacing['2xl'] }],
  sm: [cardBodyBase, { padding: vars.spacing.xl }],
});

const cardFooterBase = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  width: '100%',
  flexShrink: 0,
  paddingTop: vars.spacing.none,
});

export const cardFooter = styleVariants({
  md: [
    cardFooterBase,
    {
      paddingBottom: vars.spacing['2xl'],
      paddingInline: vars.spacing['2xl'],
    },
  ],
  sm: [
    cardFooterBase,
    {
      paddingBottom: vars.spacing.xl,
      paddingInline: vars.spacing.xl,
    },
  ],
});
