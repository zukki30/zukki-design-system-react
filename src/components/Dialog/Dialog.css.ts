import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

const elevation4 = vars.Elevation.Styles.elevation4;

export const dialog = style({
  boxSizing: 'border-box',
  flexDirection: 'column',
  alignItems: 'stretch',
  width: '520px',
  maxWidth: `calc(100% - ${vars.spacing.xl} - ${vars.spacing.xl})`,
  // 余白はルートではなく各パーツが持つ。
  // ヘッダーが任意になったため、ルートに上余白を置くと未合成時に本文の余白と二重になる
  padding: 0,
  backgroundColor: vars.color.surface.raised,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: vars.color.surface.subtle,
  borderRadius: vars['border-radius'].xl,
  boxShadow: `${elevation4.x} ${elevation4.y} ${elevation4.blur}px ${elevation4.spread} ${elevation4.color}`,
  color: vars.color.textOnSurface.default,
  // モーダル表示中の dialog は UA スタイルで overflow:auto / max-height を持つため、
  // 本文が長いとダイアログ自体がスクロールする。そのスクロールが背景へ連鎖しないようにする
  overscrollBehavior: 'contain',

  selectors: {
    // ネイティブ dialog は閉じている間 display:none。開いているときだけ flex にする
    '&[open]': {
      display: 'flex',
    },
  },

  '::backdrop': {
    backgroundColor: vars.color.black,
    opacity: 0.25,
  },
});

export const dialogHeader = style({
  boxSizing: 'border-box',
  display: 'flex',
  alignItems: 'center',
  gap: vars.spacing.md,
  width: '100%',
  flexShrink: 0,
  paddingBlockStart: vars.spacing['2xl'],
  paddingInline: vars.spacing['2xl'],
});

export const dialogTitle = style({
  margin: 0,
  flexShrink: 0,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].bold,
  fontSize: vars['font-size'].xl,
  lineHeight: vars['line-height'].heading,
  color: vars.color.textOnSurface.default,
});

export const dialogClose = style({
  marginInlineStart: 'auto',
  flexShrink: 0,
});

export const dialogBody = style({
  boxSizing: 'border-box',
  width: '100%',
  flexShrink: 0,
  padding: vars.spacing['2xl'],
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].default,
  color: vars.color.textOnSurface.default,
});

export const dialogFooter = style({
  boxSizing: 'border-box',
  display: 'flex',
  gap: vars.spacing.md,
  alignItems: 'center',
  justifyContent: 'flex-end',
  width: '100%',
  flexShrink: 0,
  paddingTop: vars.spacing.none,
  paddingBottom: vars.spacing['2xl'],
  paddingInline: vars.spacing['2xl'],
});
