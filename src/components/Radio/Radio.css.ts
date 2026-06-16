import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

const cb = vars.color['checkbox & radio'];

const BOX_SIZE = 24;
const DOT_SIZE = 10;

export const radio = style({
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

export const radioControl = style({
  position: 'relative',
  flexShrink: 0,
  display: 'inline-flex',
  width: BOX_SIZE,
  height: BOX_SIZE,
});

export const radioInput = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  opacity: 0,
  cursor: 'inherit',
});

export const radioBox = style({
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
  borderRadius: vars['border-radius'].full,
  color: cb.icon.default,
  transition: 'background-color 0.2s ease-in-out, border-color 0.2s ease-in-out',

  selectors: {
    [`${radioInput}:hover:not(:disabled):not(:checked) + &`]: {
      borderColor: cb.border.hover,
    },
    [`${radioInput}:checked + &`]: {
      backgroundColor: cb.background.checked,
      borderColor: cb.border.checked,
    },
    [`${radioInput}:checked:hover:not(:disabled) + &`]: {
      backgroundColor: cb.background['checked hover'],
      borderColor: cb.border['checked hover'],
    },
    [`${radioInput}:disabled:not(:checked) + &`]: {
      backgroundColor: cb.background.disabled,
      borderColor: cb.border.disabled,
    },
    [`${radioInput}:disabled:checked + &`]: {
      backgroundColor: cb.background['checked disabled'],
      borderColor: cb.border['checked disabled'],
      color: cb.icon['checked disabled'],
    },
    [`${radioInput}:focus-visible + &`]: {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing.xs,
    },
  },
});

export const radioDot = style({
  width: DOT_SIZE,
  height: DOT_SIZE,
  borderRadius: vars['border-radius'].full,
  backgroundColor: 'currentColor',
  opacity: 0,

  selectors: {
    [`${radioInput}:checked + ${radioBox} &`]: {
      opacity: 1,
    },
  },
});

export const radioLabel = style({
  paddingBlock: vars.spacing['2xs'],
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].line,
  color: vars.color.textOnLight.default,
  wordBreak: 'break-word',

  selectors: {
    [`${radio}[data-disabled="true"] &`]: {
      color: vars.color.textOnLight.disabled,
    },
  },
});
