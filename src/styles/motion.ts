import type { StyleRule } from '@vanilla-extract/css';

/**
 * `@media` 配下に書けるスタイル（`@media` のネストを含まないスタイル）
 */
export type MediaStyleRule = NonNullable<StyleRule['@media']>[string];

/**
 * OS のモーション低減設定に一致するメディアクエリ条件
 */
export const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)';

/**
 * モーション低減設定時にのみ適用されるスタイルを生成する共通 mixin。
 *
 * `style()` の中にスプレッドして使う。同一ルール内にメディアクエリが展開されるため、
 * ベース宣言より後に出力され、クラス合成の順序に依存せず上書きできる。
 *
 * @example
 * export const box = style({
 *   transition: 'opacity 0.2s ease-in-out',
 *   ...reducedMotion({ transition: 'none' }),
 * });
 */
export const reducedMotion = (rule: MediaStyleRule): StyleRule => ({
  '@media': {
    [REDUCED_MOTION_QUERY]: rule,
  },
});

/**
 * モーション低減設定時にトランジション・アニメーションを完全に停止する mixin。
 *
 * @example
 * export const box = style({
 *   transition: 'background-color 0.2s ease-in-out',
 *   ...reducedMotionNone,
 * });
 */
export const reducedMotionNone: StyleRule = reducedMotion({
  transition: 'none',
  animation: 'none',
});
