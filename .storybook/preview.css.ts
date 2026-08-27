import { vars } from '../src/styles/theme.css';
import { globalStyle } from '@vanilla-extract/css';

/**
 * ストーリーのキャンバスにページ面のトークンを当てる。
 *
 * これが無いと Storybook 既定の白い背景の上でダーク配色が描画され、
 * `pnpm test:a11y` のダーク側がホストアプリと違う背景でコントラストを測ってしまう。
 * ライブラリ側で body にスタイルを当てるわけにはいかないため、Storybook 専用に置く。
 */
globalStyle('body', {
  backgroundColor: vars.color.surface.page,
  color: vars.color.textOnSurface.default,
});
