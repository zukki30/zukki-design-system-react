import type { Preview } from '@storybook/react';
import { themes } from '@storybook/theming';
import { prefersDark } from './theme';

import './style.css';

const preview: Preview = {
  parameters: {
    docs: {
      toc: { headingSelector: 'h1, h2, h3' },
      theme: prefersDark ? themes.dark : themes.light,
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
