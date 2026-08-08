import type { StyleRule } from '@vanilla-extract/css';

/**
 * 1 行に収め、あふれたぶんを省略記号（…）で示す共通 mixin。
 *
 * - `min-width: 0` — flex / grid アイテムの自動最小サイズ（`min-content`）を解除する。
 *   これがないとコンテンツ幅より縮まないため、以降の宣言が発動しない
 * - `overflow: hidden` / `text-overflow: ellipsis` / `white-space: nowrap` — 省略表示の 3 点セット
 *
 * `text-overflow` は flex / grid コンテナ自身には効かないため、テキストを直接持つ要素
 * （多くの場合はラベル専用の要素）に適用する。
 *
 * 省略してもテキストは DOM に残るため、スクリーンリーダーは全文を読み上げる。
 *
 * `style()` の中にスプレッドして使う。
 *
 * @example
 * export const label = style({
 *   ...truncate,
 *   color: vars.color.textOnLight.default,
 * });
 */
export const truncate: StyleRule = {
  minWidth: 0,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};
