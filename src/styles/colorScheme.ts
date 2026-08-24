import type { StyleRule } from '@vanilla-extract/css';

/**
 * 入力系コンポーネントを UA 描画のパーツごとライト配色に固定する共通 mixin。
 *
 * `src/styles/variables.css` の `:root` は `color-scheme: light dark` を宣言している一方、
 * 入力面のトークンはライト・ダークとも白背景 + 濃色テキストで実質ライト固定になっている
 * （`--color-input-background-default` / `--color-text-on-light-default`）。
 * そのため OS がダークだと、**CSS で色を指定していない UA 描画のパーツだけが暗く描画** され、
 * 明るいフィールドの上に暗い選択ハイライトやネイティブウィジェット（`type="date"` の
 * ピッカーなど）、スクロールバー、オートフィル背景が載ってしまう。
 *
 * `color-scheme` は継承プロパティなので、フィールド単体ではなく **コンポーネントのルート要素**
 * に置く。そうしないとフィールドと装飾要素で `light-dark()` の解決側がずれる
 * （Select ではエラー状態のときシェブロンだけダーク解決になりコントラストが落ちた）。
 *
 * 副作用として、適用した要素の内側で参照する `light-dark()` はすべてライト側に固定される。
 * パレット系トークンにダーク値を持たせたまま入力系だけを揃えたいので、`:root` ではなく
 * コンポーネント単位でスコープを絞って適用する。
 *
 * この副作用が唯一フィールドの外に及ぶのがフォーカスリングで、`--color-focus` は
 * `light-dark(#0e70f1, #5b9ef5)` とライト・ダークで値が異なる。入力系はいずれも
 * `outline-offset` を持つため、リングはホストアプリのページ背景の上に載り、ダーク背景
 * （例: `#15171a`）でのコントラストは約 6.5:1 から約 3.9:1 に下がる。WCAG 1.4.11 の
 * 非テキスト 3:1 は満たしており、リングの色がコンポーネント間でぶれないほうを優先する。
 * なお `color-scheme` は要素単位のプロパティなので、`:focus-visible` の宣言だけ解決側を
 * 戻すことはできない（フォーカス中だけ UA 描画のパーツが暗転してしまう）。
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
