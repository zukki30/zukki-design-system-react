import type { ReactNode } from 'react';

/**
 * ラッパー要素で包んで描画する価値のある内容かどうか。
 *
 * React が何も描画しない値（`null` / `undefined` / `boolean`）を「未指定」とみなす。
 * `!= null` だけでは `{cond && label}` が偽のときに残る `false` を拾ってしまい、
 * 中身が空のラッパー要素が描画されて余白（`gap`）だけが残る。
 *
 * `0` や `''` は描画対象として扱う。`<Checkbox>{count}</Checkbox>` で `count` が `0` の
 * ときにラベルが黙って消えるのを防ぐため、truthy 判定にはしない
 *
 * @example
 * {isRenderable(children) && <span className={checkboxLabel}>{children}</span>}
 */
export const isRenderable = (node: ReactNode): boolean => node != null && typeof node !== 'boolean';
