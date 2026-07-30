import { reducedMotionNone } from '@/styles/motion';
import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

const sw = vars.color.switch;

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 24;
const THUMB_SIZE = 20;
const THUMB_INSET = 2;
// つまみの移動量: トラック幅 - つまみ - 左右インセット
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2;

export const switchRoot = style({
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

export const switchControl = style({
  position: 'relative',
  flexShrink: 0,
  display: 'inline-flex',
  width: TRACK_WIDTH,
  height: TRACK_HEIGHT,
});

export const switchInput = style({
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  margin: 0,
  opacity: 0,
  cursor: 'inherit',
});

export const switchTrack = style({
  pointerEvents: 'none',
  boxSizing: 'border-box',
  position: 'relative',
  width: TRACK_WIDTH,
  height: TRACK_HEIGHT,
  backgroundColor: sw.background.default,
  borderRadius: vars['border-radius'].full,
  transition: 'background-color 0.2s ease-in-out',
  ...reducedMotionNone,

  selectors: {
    [`${switchInput}:hover:not(:disabled):not(:checked) + &`]: {
      backgroundColor: sw.background.hover,
    },
    [`${switchInput}:checked + &`]: {
      backgroundColor: sw.background.checked,
    },
    [`${switchInput}:checked:hover:not(:disabled) + &`]: {
      backgroundColor: sw.background['checked hover'],
    },
    [`${switchInput}:disabled:not(:checked) + &`]: {
      backgroundColor: sw.background.disabled,
    },
    [`${switchInput}:disabled:checked + &`]: {
      backgroundColor: sw.background['checked disabled'],
    },
    [`${switchInput}:focus-visible + &`]: {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing.xs,
    },
  },
});

export const switchThumb = style({
  position: 'absolute',
  top: THUMB_INSET,
  left: THUMB_INSET,
  width: THUMB_SIZE,
  height: THUMB_SIZE,
  borderRadius: vars['border-radius'].full,
  backgroundColor: sw.icon.default,
  transition: 'transform 0.2s ease-in-out, background-color 0.2s ease-in-out',
  // モーション低減時はつまみを移動アニメーションなしで切り替える
  ...reducedMotionNone,

  selectors: {
    [`${switchInput}:checked + ${switchTrack} &`]: {
      transform: `translateX(${THUMB_TRAVEL}px)`,
    },
    [`${switchInput}:disabled + ${switchTrack} &`]: {
      backgroundColor: sw.icon.disabled,
    },
  },
});

export const switchLabel = style({
  paddingBlock: vars.spacing['2xs'],
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].base,
  lineHeight: vars['line-height'].line,
  color: vars.color.textOnLight.default,
  wordBreak: 'break-word',

  selectors: {
    [`${switchRoot}[data-disabled="true"] &`]: {
      color: vars.color.textOnLight.disabled,
    },
  },
});
