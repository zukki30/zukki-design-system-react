import { inputColorSchemeLight } from '@/styles/colorScheme';
import { reducedMotionNone } from '@/styles/motion';
import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

const SPIN_WIDTH = 22;
const FIELD_MIN_WIDTH = 80;

export const inputNumber = style({
  // UA が描画するパーツをライト固定のフィールドに合わせる（詳細は mixin の JSDoc）。
  // ネイティブのスピンボタンは inputNumberField 側で非表示にしているため対象外
  ...inputColorSchemeLight,
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'stretch',
  overflow: 'hidden',
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

export const inputNumberField = style({
  flex: '1 1 auto',
  minWidth: FIELD_MIN_WIDTH,
  boxSizing: 'border-box',
  border: 'none',
  outline: 'none',
  backgroundColor: 'transparent',
  paddingInline: vars.spacing.sm,
  paddingBlock: vars.spacing.md,
  fontFamily: vars['font-family'].number,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].line,
  // 桁を等幅にして、スピンボタンでの増減時に数値が横揺れしないようにする
  fontVariantNumeric: 'tabular-nums',
  color: vars.color.textOnLight.default,

  selectors: {
    '&::placeholder': {
      color: vars.color.textOnLight.placeholder,
    },
    // ネイティブのスピンボタンを隠す（独自ボタンで代替）
    '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '&:disabled': {
      color: vars.color.textOnLight.disabled,
      WebkitTextFillColor: vars.color.textOnLight.disabled,
      cursor: 'not-allowed',
    },
    [`${inputNumber}[data-error="true"] &`]: {
      color: vars.color.textOnFailure.default,
    },
  },
  MozAppearance: 'textfield',
  appearance: 'textfield',
});

export const inputNumberSpin = style({
  display: 'flex',
  flexDirection: 'column',
  flexShrink: 0,
  width: SPIN_WIDTH,
  borderInlineStartWidth: 1,
  borderInlineStartStyle: 'solid',
  borderInlineStartColor: vars.color.input.border.default,

  selectors: {
    [`${inputNumber}[data-error="true"] &`]: {
      borderInlineStartColor: vars.color.input.border.error,
    },
    [`${inputNumber}[data-disabled="true"] &`]: {
      borderInlineStartColor: vars.color.input.border.disabled,
    },
  },
});

export const inputNumberSpinButton = style({
  flex: '1 1 0',
  boxSizing: 'border-box',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: vars.spacing.none,
  border: 'none',
  backgroundColor: 'transparent',
  color: vars.color.textOnLight.default,
  cursor: 'pointer',
  lineHeight: 0,
  transition: 'background-color 0.2s ease-in-out',
  ...reducedMotionNone,

  selectors: {
    '&:hover:not(:disabled)': {
      backgroundColor: vars.color.input.spinButtonBackground.hover,
    },
    '&:disabled': {
      color: vars.color.textOnLight.disabled,
      cursor: 'not-allowed',
    },
  },
});

export const inputNumberSpinDivider = style({
  height: 1,
  flexShrink: 0,
  backgroundColor: vars.color.input.border.default,

  selectors: {
    [`${inputNumber}[data-error="true"] &`]: {
      backgroundColor: vars.color.input.border.error,
    },
    [`${inputNumber}[data-disabled="true"] &`]: {
      backgroundColor: vars.color.input.border.disabled,
    },
  },
});
