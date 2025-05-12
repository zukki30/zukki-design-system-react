import { vars } from '@/styles/theme.css';
import { keyframes, style } from '@vanilla-extract/css';

const fade = keyframes({
  '0%': { opacity: 0.2 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.2 },
});

export const skeleton = style({
  display: 'inline-block',
  borderRadius: vars['border-radius'].xs,
  backgroundColor: vars.color.grey[200],
  animation: `${fade} 3s ease-in-out infinite`,

  selectors: {
    '&[data-circle="true"]': {
      borderRadius: vars['border-radius'].full,
    },
  },
});
