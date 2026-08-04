import type { StyleRule } from '@vanilla-extract/css';

/**
 * インタラクティブ要素（ボタン・クリック可能な領域）向けのタッチ操作最適化 mixin。
 *
 * - `touch-action: manipulation` — ダブルタップズームを無効化し、モバイルブラウザの
 *   タップ後 約 300ms の遅延をなくす
 * - `-webkit-tap-highlight-color: transparent` — iOS Safari / Android Chrome の
 *   既定のタップハイライトを消し、hover / focus-visible の表現に統一する
 *
 * `style()` の中にスプレッドして使う。
 *
 * @example
 * export const button = style({
 *   cursor: 'pointer',
 *   ...interactiveTouch,
 * });
 */
export const interactiveTouch: StyleRule = {
  touchAction: 'manipulation',
  WebkitTapHighlightColor: 'transparent',
};
