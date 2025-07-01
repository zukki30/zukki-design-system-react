import type { ThemeVars } from 'storybook/theming';
import { create } from 'storybook/theming/create';

export const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

const theme: ThemeVars = create({
  base: prefersDark ? 'dark' : 'light',
  brandTitle: 'Zukki Design System React',
});

export default theme;
