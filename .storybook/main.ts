import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],

  addons: [
    '@storybook/addon-onboarding',
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    // axe-core によるパネル表示と、テスト実行時の a11y 検査フックを提供する
    '@storybook/addon-a11y',
    // ストーリーを Vitest のテストとして実行する。addon-a11y のフックはこれが駆動する
    '@storybook/addon-vitest'
  ],

  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: 'vite.config.ts',
      },
    },
  },

  typescript: {
    reactDocgen: 'react-docgen-typescript',
  }
};
export default config;
