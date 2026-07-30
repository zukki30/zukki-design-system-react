import { reducedMotion } from '@/styles/motion';
import { vars } from '@/styles/theme.css';
import { keyframes, style, styleVariants } from '@vanilla-extract/css';

const rotate = keyframes({
  '0%': { transform: 'rotate(0deg)' },
  '100%': { transform: 'rotate(360deg)' },
});

export const spinner = style({
  verticalAlign: 'top',
  fill: 'none',
  strokeWidth: 2,
  strokeLinecap: 'round',
  // SVG の transform-origin は既定が要素の原点になるため中心を明示する
  transformOrigin: 'center',
  animation: `${rotate} 1s linear infinite`,
  // ローディング中であることは伝え続ける必要があるため、停止ではなく回転を十分に遅くする
  ...reducedMotion({ animationDuration: '3s' }),
});

export const spinnerVariant = styleVariants({
  light: {
    stroke: vars.color.grey[1000],
  },
  dark: {
    stroke: vars.color.grey[0],
  },
  primary: {
    stroke: vars.color.primary.default,
  },
});
