import { vars } from '@/styles/theme.css';
import { globalStyle, style } from '@vanilla-extract/css';

const ICON_SIZE = 20;

export const select = style({
  position: 'relative',
  display: 'inline-flex',
  width: '100%',
});

export const selectField = style({
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
  boxSizing: 'border-box',
  width: '100%',
  margin: 0,
  paddingBlock: vars.spacing.md,
  paddingInlineStart: vars.spacing.sm,
  // 右側はシェブロンアイコンのスペースを確保する（左右パディング + アイコン幅）
  paddingInlineEnd: `calc(${vars.spacing.sm} * 2 + ${ICON_SIZE}px)`,
  backgroundColor: vars.color.input.background.default,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: vars.color.input.border.default,
  borderRadius: vars['border-radius'].lg,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].line,
  color: vars.color.textOnLight.default,
  cursor: 'pointer',
  transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',

  selectors: {
    // 値未選択（placeholder option が選択中）はプレースホルダー色
    [`${select}:not([data-error="true"]) &:has(option[value=""]:checked):not(:disabled)`]: {
      color: vars.color.textOnLight.placeholder,
    },
    [`${select}:not([data-error="true"]) &:hover:not(:disabled)`]: {
      borderColor: vars.color.input.border.hover,
    },
    '&:focus-visible': {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing.xs,
    },
    [`${select}[data-error="true"] &`]: {
      backgroundColor: vars.color.input.background.error,
      borderColor: vars.color.input.border.error,
      color: vars.color.textOnFailure.default,
    },
    [`${select}[data-error="true"] &:hover:not(:disabled)`]: {
      borderColor: vars.color.input.border['error hover'],
    },
    '&:disabled': {
      backgroundColor: vars.color.input.background.disabled,
      borderColor: vars.color.input.border.disabled,
      color: vars.color.textOnLight.disabled,
      cursor: 'not-allowed',
    },
  },
});

// ネイティブの選択肢リスト（ブラウザ描画。指定可能な範囲で色を合わせる）
globalStyle(`${selectField} option`, {
  color: vars.color.textOnLight.default,
});

globalStyle(`${selectField} option:disabled`, {
  color: vars.color.textOnLight.disabled,
});

export const selectIcon = style({
  position: 'absolute',
  insetBlock: 0,
  insetInlineEnd: vars.spacing.sm,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  pointerEvents: 'none',
  color: vars.color.textOnLight.subtle,

  selectors: {
    [`${select}[data-error="true"] &`]: {
      color: vars.color.textOnFailure.default,
    },
    [`${select}[data-disabled="true"] &`]: {
      color: vars.color.textOnLight.disabled,
    },
  },
});
