import { vars } from '@/styles/theme.css';
import { keyframes, style } from '@vanilla-extract/css';

const rotate = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const spinner = style({
  verticalAlign: 'top',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  stroke: vars.color.grey[1000],
  animation: `${rotate} 1s linear infinite`,
  selectors: {
    '&[data-variant="light"]': {
      stroke: vars.color.grey[1000],
    },
    '&[data-variant="dark"]': {
      stroke: vars.color.grey[0],
    },
  },
});
