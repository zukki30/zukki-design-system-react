import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

const STEP_ITEM_BAR_MIN_SIZE = 2;

export const stepsBase = style({
  padding: vars.spacing.none,
  margin: vars.spacing.none,
  listStyle: 'none',
  display: 'flex',
  justifyContent: 'space-between',
});

export const steps = styleVariants({
  horizontal: [
    stepsBase,
    {
      alignItems: 'center',
      gap: vars.spacing.md,
    },
  ],
  vertical: [
    stepsBase,
    {
      flexDirection: 'column',
      gap: vars.spacing.sm,
    },
  ],
});

export const stepsItemContainer = style({
  display: 'flex',
  flex: 1,
  minWidth: 0,

  '::after': {
    backgroundColor: vars.color.grey[100],
    content: '',
  },

  selectors: {
    '&:last-child': {
      // 末尾は伸ばさないが、ラベルが長いときに縮む余地は残す
      flex: '0 1 auto',
    },
    '&:last-child::after': {
      display: 'none',
    },
    '&[data-vertical=false]': {
      gap: vars.spacing.md,
      alignItems: 'center',
    },
    '&[data-vertical=false]::after': {
      flex: 1,
      height: STEP_ITEM_BAR_MIN_SIZE,
    },
    '&[data-vertical=true]': {
      gap: vars.spacing.sm,
      flexDirection: 'column',
    },
    '&[data-vertical=true]::after': {
      width: STEP_ITEM_BAR_MIN_SIZE,
      height: 20,
      marginInlineStart: `calc(${vars.spacing['xl']} - ${STEP_ITEM_BAR_MIN_SIZE}px)`,
    },
  },
});
