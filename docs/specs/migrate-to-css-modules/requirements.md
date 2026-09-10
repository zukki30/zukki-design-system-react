# 要件: スタイリングを Vanilla Extract から CSS Modules へ移行する

対象 Issue: [#84 CSS を CSS.modules.css に変更する](https://github.com/zukki30/zukki-design-system-react/issues/84)

## Issue の指示

> vanilla-extract を利用しているが CSS.modules.css に移行する
> CSS 変数は variables.css, variables-light-only.css, variables-dark-only.css を使用する想定で、各種 CSS を指定。
> storybook は variables.css を使用して切り替え

この 3 行から読み取れる要求は次の 3 つである。

1. スタイルの記述方式を Vanilla Extract から CSS Modules（`*.module.css`）へ変える
2. コンポーネントは **意味的な CSS 変数**（`--color-primary-default` など）を直接参照する
3. 配布する 3 種類の CSS は、既に生成済みの `variables.css` / `variables-light-only.css` / `variables-dark-only.css` を土台にする。Storybook は `variables.css` を読み、`color-scheme` で切り替える

## 現状（実測値）

`main`（`6485c61`）のソースを読んで確認した事実である。

### A. Vanilla Extract の使用範囲

| 場所 | ファイル数 | 行数 |
| --- | --- | --- |
| `src/components/**/*.css.ts` | 19 | 2,177 |
| `src/styles/theme.css.ts` | 1 | 11 |
| `.storybook/preview.css.ts` | 1 | 29 |

API の内訳は `style()` 77 / `styleVariants()` 15 / `globalStyle()` 3（すべて `Select`）/ `keyframes()` 2（`Skeleton` / `Spinner`）/ `createGlobalTheme()` 1。

`src/components/` は 19 ディレクトリで、`.css.ts` を持たないのは `Icon` のみ。`Steps` だけが `Steps.css.ts` と `StepsItem.css.ts` の 2 枚を持つ。

### B. CSS 変数が二重に存在している

いま `:root` には **2 系統の変数** が載っている。

| 系統 | 出どころ | 例 | 参照者 |
| --- | --- | --- | --- |
| 意味的な変数 | `src/styles/variables.css`（`main.tsx` が import） | `--color-primary-default` | **いない** |
| ハッシュ変数 | `createGlobalTheme(':root', …)` が生成 | `--_1x2y3z4` | 全コンポーネント |

`src/design-tokens/*.ts` と `src/styles/variables*.css` は同じ Figma トークンから生成された **同じ値の別表現** で、`createGlobalTheme` が前者からハッシュ変数を作り直している。結果として同じ値が 2 回 `:root` に出力され、意味的な変数のほうは誰も参照していない。

AGENTS.md が「意味的な変数を差し替えても見た目は変わらない」と注意書きしているのはこのためである。本移行はこの二重定義を解消する。

### C. `variables-light-only.css` / `variables-dark-only.css` が未使用

生成はされているが、参照しているコードが無い。配色を固定した配布 CSS は、代わりに `scripts/build-css-variants.ts` が `dist/zukki-design-system.css` の `light-dark(a, b)` を **文字列として** 解析・解決して作っている（80 行の自作パーサ）。

Issue が「variables-light-only.css, variables-dark-only.css を使用する想定」と言っているのは、この経路を作り直す指示と読める。

### D. `src/styles/` の共有 mixin

`StyleRule` オブジェクトを export し、`style()` の中へスプレッドして使う形。それぞれに単体テストが付いている。

| mixin | ファイル | 使用ファイル数 | 中身 |
| --- | --- | --- | --- |
| `inputColorSchemeLight` | `colorScheme.ts` | 4 | `color-scheme: light` |
| `interactiveTouch` | `interactive.ts` | 3 | `touch-action` / `-webkit-tap-highlight-color` |
| `reducedMotion()` / `reducedMotionNone` | `motion.ts` | 11 | `@media (prefers-reduced-motion: reduce)` |
| `truncate` | `text.ts` | 4 | `min-width` / `overflow` / `text-overflow` / `white-space` |

`motion.ts` の JSDoc は「同一ルール内にメディアクエリが展開されるため、ベース宣言より後に出力され、**クラス合成の順序に依存せず** 上書きできる」ことを設計の要点として明記している。移行後もこの性質を保つ必要がある。

### E. `vars` を参照している非 `.css.ts` ファイル

`vars` は `.css.ts` 以外からも 3 箇所参照されている。移行で `vars` が消えるため、いずれも書き換えが要る。

| ファイル | 用途 |
| --- | --- |
| `src/components/Card/Card.stories.tsx` | ストーリー内のインラインスタイル |
| `src/components/Spinner/Spinner.stories.tsx` | 同上 |
| `src/components/Steps/Steps.spec.tsx` | `getComputedStyle().fontWeight` を `vars['font-weight'].bold` と比較 |

### F. クラス名を import しているテスト

`Card` / `Skeleton` / `Dialog` / `Button` / `Steps` の spec が `*.css` からクラス名を import して `toHaveClass` などに使っている。CSS Modules でも `import styles from './X.module.css'` で同じことができるが、import 形式が変わる。

### G. 型安全性の現状

Vanilla Extract では `vars.color.primaryy.default` のような綴り違いが **型エラー** になる。クラス名 `buttonInner` も export された値なので同様。

一方 `vite/client` の型定義では `*.module.css` は `{ readonly [key: string]: string }` で、`styles.buttonInnner` は `undefined` を返すだけで型エラーにならない。**タイポが黙って「クラス未適用」になる**。移行にあたって最大の機能後退はここである。

## 要件

### R1. スタイルの記述方式

- **R1-1** すべてのコンポーネントスタイルを `ComponentName.module.css` に置く。`*.css.ts` はリポジトリから無くなる
- **R1-2** `@vanilla-extract/css` と `@vanilla-extract/vite-plugin` を依存から外す。`vite.config.ts` の `vanillaExtractPlugin()` も外す
- **R1-3** クラス名は BEM に従う（`.button` / `.button__inner` / `.button__label`）
- **R1-4** `src/styles/theme.css.ts`（`createGlobalTheme`）を廃止し、ハッシュ変数の生成をやめる

### R2. CSS 変数の参照

- **R2-1** コンポーネントは意味的な CSS 変数を `var(--color-primary-default)` の形で直接参照する
- **R2-2** ハードコードした色・余白・フォント値を新たに持ち込まない（AGENTS.md の既存規約を維持）
- **R2-3** 配色トークンの使い分け（面とテキストを対で選ぶ、`grey` を面や文字色に使わない等、AGENTS.md の表）は移行後も守る。移行は値の付け替えを伴わない

### R3. 配布する 3 種類の CSS

- **R3-1** `dist/styles.css` は `variables.css` 由来の `light-dark()` を保持する
- **R3-2** `dist/styles-light.css` / `dist/styles-dark.css` は `variables-light-only.css` / `variables-dark-only.css` を土台に作る。`light-dark()` を含まず、`color-scheme` も固定する
- **R3-3** 3 種類はいずれも「CSS 変数の定義 + 全コンポーネントのスタイル」を含み、それ 1 枚を読めば動く（現状と同じ契約）
- **R3-4** `pnpm verify:dist` の既存の検査項目はすべて通る。検査の意図（React 外部化 / `light-dark()` の保持 / `color-scheme` の固定 / 固定版で値が異なること / 型の解決）は 1 つも緩めない

### R4. Storybook

- **R4-1** Storybook は `src/styles/variables.css` を読み、ルート要素の `color-scheme` で配色を切り替える（現状の `theme` グローバル + decorator の仕組みは変えない）
- **R4-2** キャンバスに `surface.page` を当てる指定は維持する。無いと `pnpm test:a11y` のダーク側が誤った背景でコントラストを測る
- **R4-3** `.storybook/preview.css.ts` は Vanilla Extract を使わない形に置き換える

### R5. 見た目と DOM

- **R5-1** 移行前後で **描画結果（計算後のスタイル）を変えない**。値の調整・リファクタは本 spec の対象外
- **R5-2** 公開 API（props・型・export）を変えない。破壊的変更を伴わない
- **R5-3** `pnpm test:a11y` がライト / ダーク両方で通る。とくに `color-contrast` が 1 件も増えない

### R6. 品質ゲート

- **R6-1** `pnpm lint:check` / `pnpm format:check` / `pnpm typecheck` / `pnpm test` / `pnpm test:a11y` / `pnpm verify:dist` がすべて通る
- **R6-2** 既存のユニットテストは、CSS Modules 化に伴う import 形式の変更を除いて振る舞いを変えない

### R7. ドキュメント

- **R7-1** `AGENTS.md` の技術スタック・コンポーネント構成・スタイリング規約を CSS Modules 前提に書き換える
- **R7-2** `README.md` の技術スタック記述を更新する
- **R7-3** `docs/agent-guide.template.md` に Vanilla Extract 前提の記述があれば更新する（利用側は CSS を読み込むだけなので、影響は無い見込み）

## 非要件（本 spec ではやらないこと）

- デザイントークンの値の変更、`figma/tokens.json` の編集
- コンポーネントの props・振る舞いの変更
- `style-dictionary/` のトークン生成パイプラインそのものの作り替え（出力ファイルに `color-scheme` を足す程度の変更は R3 のために行いうる）
- 新規コンポーネントの追加

## 決定事項

### D1. バリアントは `data-*` 属性で表す

```tsx
<button className={styles.button} data-variant={variant} data-size={size}>
  <span className={styles.button__label}>{children}</span>
</button>
```
```css
.button[data-variant='primary'] {
  background-color: var(--color-primary-default);
}
.button[data-size='sm'] .button__label {
  font-size: var(--font-size-xs);
}
```

既存の `data-selected` / `data-error` / `data-loading` / `data-shape` と同じ書き味に揃う。子要素の出し分けを親のセレクタで書けるため、`buttonLabel[size]` のような受け渡しが TSX から消える。DOM には `data-variant` / `data-size` が増えるが、R5-1（描画結果を変えない）と R5-2（公開 API を変えない）は満たす。

### D2. `*.module.css.d.ts` を生成して型安全性を保つ

`scripts/` に生成スクリプトを置き、生成物はコミットする（`src/design-tokens/*` と同じ扱い）。CI で「再生成しても差分が出ない」ことを検査する。外部プラグインは足さない。

### D3. 共有 mixin は `reducedMotion` のみ直書き、他 3 つは `composes:`

`reducedMotion` は「同一ルール内に展開されるためクラス合成の順序に依存しない」ことが設計上の要点なので、各モジュールへ `@media` を直接書く。宣言のみで衝突しない残る 3 つは `src/styles/mixins.module.css` から `composes:` で引く。

`src/styles/{colorScheme,interactive,motion,text}.ts` とその spec 4 本は役目を終える。JSDoc に書かれている「なぜそうするか」は移行先の CSS コメントへ引き継ぐ。

### D4. 1 つの PR でまとめて移行する

途中の状態を作らない。`vite.config.ts` からプラグインを外すのも 1 回で済み、`:root` に変数が二重に載る期間が発生しない。

## 検証済みの技術前提

設計の前提になる 4 点を、このリポジトリの Vite 8.2.2 / TypeScript 6.0.3 で実際にビルドして確認した。

| # | 確認したこと | 結果 |
| --- | --- | --- |
| 1 | `composes: … from '@/styles/mixins.module.css'` でエイリアスが解決できる | ✅ 解決される |
| 2 | ルール内にネストした `@media` が `cssTarget`（chrome123 / safari17.5 / firefox120）で保持される | ✅ ネストのまま出力される |
| 3 | `composes` した側の JS 値が 2 つのクラス名になる | ✅ `"_button_x _interactiveTouch_y"` |
| 4 | `X.module.css.d.ts` を TypeScript が拾い、`vite/client` の索引シグネチャより優先する | ✅ 拾う。`allowArbitraryExtensions` は不要 |

4 は形式の選択に直結する。TypeScript 5.0 以降の `X.module.d.css.ts` 形式は `allowArbitraryExtensions: true` が要るが、**レガシー形式の `X.module.css.d.ts` はオプション無しで解決される**ことを実測した。存在しないクラス名を参照すると型エラーになることも、`@ts-expect-error` を使った probe で確認済み。

2 について、出力は次のとおり `@media` がルール内に残る。ベース宣言より後に置かれるため、順序非依存の性質は保たれる。

```css
._button_13ios_1 {
  color: var(--color-primary-default);
  transition: background-color .2s ease-in-out;
  @media (prefers-reduced-motion: reduce) { transition: none; animation: none }
}
```
