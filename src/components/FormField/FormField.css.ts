import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

/**
 * 横並びのときのラベル列の幅
 */
const LABEL_COLUMN_WIDTH = 100;

export const formField = style({
  display: 'grid',
  gap: vars.spacing.sm,
  alignItems: 'start',

  selectors: {
    // パーツはルート直下に並ぶため、列の割り当てだけでラベルと入力欄を配置する。
    // 入力欄の列は minmax(0, 1fr) にして、長いコンテンツで列が広がらないようにする
    '&[data-orientation="horizontal"]': {
      gridTemplateColumns: `${LABEL_COLUMN_WIDTH}px minmax(0, 1fr)`,
    },
    '&[data-orientation="vertical"]': {
      gridTemplateColumns: 'minmax(0, 1fr)',
    },
  },
});

/**
 * 入力欄・補助テキスト・エラーメッセージが並ぶ列。
 * 横並びのときだけ 2 列目に送る（縦並びでは 1 列しかない）
 */
const formFieldControlColumn = style({
  minWidth: 0,

  selectors: {
    // data-orientation は Steps など他コンポーネントも使うため、
    // 祖先セレクタは FormField のルートに限定する
    [`${formField}[data-orientation="horizontal"] &`]: {
      gridColumn: 2,
    },
  },
});

export const formFieldLabel = style({
  gridColumn: 1,
  display: 'flex',
  alignItems: 'center',
  gap: vars.spacing.sm,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].heading,
  color: vars.color.textOnSurface.default,

  selectors: {
    // 横並びのときは入力欄の上下パディングに合わせてラベルを下げる
    [`${formField}[data-orientation="horizontal"] &`]: {
      paddingTop: vars.spacing.md,
    },
    // data-disabled も複数コンポーネントが使う共有属性のため、同様にルートへ限定する
    [`${formField}[data-disabled="true"] &`]: {
      color: vars.color.textOnSurface.disabled,
    },
  },
});

export const formFieldRequiredAsterisk = style({
  flexShrink: 0,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].heading,
  color: vars.color.failure.text,
});

export const formFieldRequiredBadge = style({
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  paddingInline: vars.spacing.xs,
  paddingBlock: vars.spacing['2xs'],
  borderRadius: vars['border-radius'].xs,
  backgroundColor: vars.color.failure.default,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].bold,
  fontSize: vars['font-size']['2xs'],
  lineHeight: vars['line-height'].line,
  color: vars.color.textOnAccent.default,
  whiteSpace: 'nowrap',
});

export const formFieldControl = style([
  formFieldControlColumn,
  {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: vars.spacing.sm,
  },
]);

export const formFieldHelperText = style([
  formFieldControlColumn,
  {
    fontFamily: vars['font-family'].default,
    fontWeight: vars['font-weight'].normal,
    fontSize: vars['font-size'].xs,
    lineHeight: vars['line-height'].default,
    color: vars.color.textOnSurface.subtle,
  },
]);

export const formFieldErrorText = style([
  formFieldControlColumn,
  {
    fontFamily: vars['font-family'].default,
    fontWeight: vars['font-weight'].normal,
    fontSize: vars['font-size'].xs,
    lineHeight: vars['line-height'].default,
    color: vars.color.textOnFailure.default,
  },
]);
