import { inputColorSchemeLight } from '@/styles/colorScheme';
import { reducedMotionNone } from '@/styles/motion';
import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

// Figma の TextArea は最小コンテンツ高さ 120px（symbol 全体 136px）
const MIN_HEIGHT = '136px';

export const textArea = style({
  // UA が描画するパーツをライト固定のフィールドに合わせる（詳細は mixin の JSDoc）
  ...inputColorSchemeLight,
  boxSizing: 'border-box',
  display: 'block',
  width: '100%',
  minHeight: MIN_HEIGHT,
  padding: vars.spacing.sm,
  backgroundColor: vars.color.input.background.default,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: vars.color.input.border.default,
  borderRadius: vars['border-radius'].lg,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].default,
  color: vars.color.textOnLight.default,
  resize: 'vertical',
  transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
  ...reducedMotionNone,

  selectors: {
    '&::placeholder': {
      color: vars.color.textOnLight.placeholder,
    },
    '&:hover:not(:disabled):not([data-error="true"])': {
      borderColor: vars.color.input.border.hover,
    },
    '&:focus-visible': {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing.xs,
    },
    '&[data-error="true"]': {
      backgroundColor: vars.color.input.background.error,
      borderColor: vars.color.input.border.error,
    },
    '&[data-error="true"]:hover:not(:disabled)': {
      borderColor: vars.color.input.border['error hover'],
    },
    '&:disabled': {
      backgroundColor: vars.color.input.background.disabled,
      borderColor: vars.color.input.border.disabled,
      color: vars.color.textOnLight.disabled,
      WebkitTextFillColor: vars.color.textOnLight.disabled,
      cursor: 'not-allowed',
      resize: 'none',
    },
  },
});
