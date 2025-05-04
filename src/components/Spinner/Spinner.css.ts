import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

export const spinner = style({
  verticalAlign: 'top',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  stroke: vars.color.grey[1000],
  selectors: {
    '&[data-variant="light"]': {
      stroke: vars.color.grey[1000],
    },
    '&[data-variant="dark"]': {
      stroke: vars.color.grey[0],
    },
  },
});
