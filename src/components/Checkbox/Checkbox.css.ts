import { reducedMotionNone } from '@/styles/motion';
import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

const cb = vars.color['checkbox & radio'];

const BOX_SIZE = 24;

export const checkbox = style({
  display: 'inline-flex',
  alignItems: 'flex-start',
  gap: vars.spacing.sm,
  cursor: 'pointer',

  selectors: {
    '&[data-disabled="true"]': {
      cursor: 'not-allowed',
    },
  },
});

export const checkboxControl = style({
  position: 'relative',
  flexShrink: 0,
  display: 'inline-flex',
  width: BOX_SIZE,
  height: BOX_SIZE,
});

export const checkboxInput = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  opacity: 0,
  cursor: 'inherit',
});

export const checkboxBox = style({
  pointerEvents: 'none',
  boxSizing: 'border-box',
  position: 'relative',
  width: BOX_SIZE,
  height: BOX_SIZE,
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: cb.background.default,
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: cb.border.default,
  borderRadius: vars['border-radius'].md,
  color: cb.icon.default,
  transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',
  ...reducedMotionNone,

  selectors: {
    [`${checkboxInput}:hover:not(:disabled):not(:checked):not(:indeterminate) + &`]: {
      borderColor: cb.border.hover,
    },
    [`${checkboxInput}:checked + &, ${checkboxInput}:indeterminate + &`]: {
      backgroundColor: cb.background.checked,
      borderColor: cb.border.checked,
    },
    [`${checkboxInput}:checked:hover:not(:disabled) + &, ${checkboxInput}:indeterminate:hover:not(:disabled) + &`]:
      {
        backgroundColor: cb.background['checked hover'],
        borderColor: cb.border['checked hover'],
      },
    [`${checkboxInput}:disabled:not(:checked):not(:indeterminate) + &`]: {
      backgroundColor: cb.background.disabled,
      borderColor: cb.border.disabled,
    },
    [`${checkboxInput}:disabled:checked + &, ${checkboxInput}:disabled:indeterminate + &`]: {
      backgroundColor: cb.background['checked disabled'],
      borderColor: cb.border['checked disabled'],
      color: cb.icon['checked disabled'],
    },
    [`${checkboxInput}:focus-visible + &`]: {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing.xs,
    },
  },
});

const checkboxIconBase = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
});

export const checkboxCheckIcon = style([
  checkboxIconBase,
  {
    opacity: 0,

    selectors: {
      [`${checkboxInput}:checked + ${checkboxBox} &`]: {
        opacity: 1,
      },
      // checked かつ indeterminate のときは indeterminate を優先しチェックを隠す
      [`${checkboxInput}:indeterminate + ${checkboxBox} &`]: {
        opacity: 0,
      },
    },
  },
]);

export const checkboxMinusIcon = style([
  checkboxIconBase,
  {
    opacity: 0,

    selectors: {
      [`${checkboxInput}:indeterminate + ${checkboxBox} &`]: {
        opacity: 1,
      },
    },
  },
]);

export const checkboxLabel = style({
  paddingBlock: vars.spacing['2xs'],
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].line,
  color: vars.color.textOnSurface.default,
  wordBreak: 'break-word',

  selectors: {
    [`${checkbox}[data-disabled="true"] &`]: {
      color: vars.color.textOnSurface.disabled,
    },
  },
});
