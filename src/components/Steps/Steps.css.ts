import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

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
