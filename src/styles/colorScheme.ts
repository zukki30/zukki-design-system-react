import type { StyleRule } from '@vanilla-extract/css';

/**
 * 入力系コンポーネントを UA 描画のパーツごとライト配色に固定する共通 mixin。
 *
 * `src/styles/variables.css` の `:root` は `color-scheme: light dark` を宣言している一方、
 * 入力面のトークンはライト・ダークとも白背景 + 濃色テキストで実質ライト固定になっている
 * （`--color-input-background-default` / `--color-text-on-light-default`）。
 * そのため OS がダークだと、**CSS で色を指定していない UA 描画のパーツだけが暗く描画** され、
 * 明るいフィールドの上に暗いリサイザやスクロールバー、暗いオートフィル背景が載ってしまう。
 *
 * `color-scheme` は継承プロパティなので、フィールド単体ではなく **コンポーネントのルート要素**
 * に置く。そうしないとフィールドと装飾要素で `light-dark()` の解決側がずれる
 * （Select ではエラー状態のときシェブロンだけダーク解決になりコントラストが落ちた）。
 *
 * 副作用として、適用した要素の内側で参照する `light-dark()` はすべてライト側に固定される。
 * パレット系トークンにダーク値を持たせたまま入力系だけを揃えたいので、`:root` ではなく
 * コンポーネント単位でスコープを絞って適用する。
 *
 * `style()` の中にスプレッドして使う。
 *
 * @example
 * export const input = style({
 *   ...inputColorSchemeLight,
 *   backgroundColor: vars.color.input.background.default,
 * });
 */
export const inputColorSchemeLight: StyleRule = {
  colorScheme: 'light',
};
