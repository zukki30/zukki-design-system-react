import type { Preview } from '@storybook/react-vite';
import { themes } from 'storybook/theming';
import { prefersDark } from './theme';

// コンポーネントが参照する CSS 変数の定義。
// ライブラリ本体では src/main.tsx が読んでいるが、Storybook は main.tsx を通らないため
// ここで明示的に読む。light-dark() を保持した版を読み、配色は decorator が
// ルート要素の color-scheme で切り替える
import '../src/styles/variables.css';
import './preview.css';

const preview: Preview = {
  // 配色は theme グローバルで切り替える。
  // ツールバーからの操作とテスト実行時の initialGlobals が同じ仕組みを通るため、
  // Storybook 上で見えているものとテストが検査するものが一致する
  initialGlobals: {
    theme: 'light',
  },

  globalTypes: {
    theme: {
      description: 'コンポーネントの配色',
      toolbar: {
        title: '配色',
        icon: 'circlehollow',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, { globals }) => {
      const isDark = globals.theme === 'dark';
      // className への代入は Storybook 自身が付けるクラスを消してしまうため toggle を使う。
      // color-scheme は継承プロパティなので、ルート要素に当てれば light-dark() が全体に効く
      const root = document.documentElement;

      root.classList.toggle('dark-theme', isDark);
      root.classList.toggle('light-theme', !isDark);

      return <Story />;
    },
  ],

  parameters: {
    a11y: {
      // 違反があればストーリーのテストを失敗させる。
      // 個別に繰り延べたいものは、そのストーリー / meta 側でルールを絞って無効化する
      test: 'error',
    },
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

  tags: ['autodocs'],
};

export default preview;
