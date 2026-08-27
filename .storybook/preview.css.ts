import { vars } from '../src/styles/theme.css';
import { globalStyle } from '@vanilla-extract/css';

/*
 * Storybook のキャンバスに当てるスタイル。ライブラリの配布物には含まれないため、
 * ここでだけ body やテーマクラスのようなグローバルセレクタを触ってよい。
 *
 * vanilla-extract のファイルなので、preview.tsx からは `./preview.css` として import する
 * （`@/styles/theme.css` が `theme.css.ts` に解決されるのと同じ規約）。
 */

// 配色は preview.tsx の decorator が theme グローバルに応じて付け替える。
// color-scheme は継承プロパティなので、ルート要素に当てれば light-dark() が全体で解決される
globalStyle('.light-theme', {
  colorScheme: 'light',
});

globalStyle('.dark-theme', {
  colorScheme: 'dark',
});

// キャンバスにページ面のトークンを当てる。
// これが無いと Storybook 既定の白い背景の上でダーク配色が描画され、
// `pnpm test:a11y` のダーク側がホストアプリと違う背景でコントラストを測ってしまう
globalStyle('body', {
  backgroundColor: vars.color.surface.page,
  color: vars.color.textOnSurface.default,
});
