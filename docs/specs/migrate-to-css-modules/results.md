# 結果: スタイリングを Vanilla Extract から CSS Modules へ移行する

対象 Issue: [#84](https://github.com/zukki30/zukki-design-system-react/issues/84)

## やったこと

`src/components/**/*.css.ts` 19 枚（2,177 行）を `*.module.css` へ書き換え、`@vanilla-extract/css` と `@vanilla-extract/vite-plugin` を依存から外した。コンポーネントは意味的な CSS 変数（`--color-primary-default` など）を直接参照するようになり、`createGlobalTheme` が生成していたハッシュ変数（`--_xxx`）は無くなった。

## 数値

| 項目 | 移行前 | 移行後 |
| --- | --- | --- |
| スタイルのファイル | `.css.ts` 19 枚 | `.module.css` 19 枚 + 生成した `.d.ts` 19 枚 |
| 共有 mixin | `src/styles/*.ts` 4 本 + spec 4 本 | `mixins.module.css` 1 枚（モーション低減は各所へ直書き） |
| `:root` に載る変数 | 意味的 312 + ハッシュ 312 の二重 | 意味的 312 のみ |
| 配布 CSS（`styles.css`） | 56,199 bytes | 59,834 bytes |
| ユニットテスト | 394 | 437 |
| a11y テスト | 208 | 210 |

配布 CSS が 3.6KB 増えたのは、固定版の土台に使う `variables-*-only.css` を minify せずそのまま前置しているのと、`composes` でクラスが分かれたぶんセレクタが増えたため。ハッシュ変数 312 件が消えたぶんは減っている。

ユニットテストが 43 件増えたのは、クラス名の変化で見ていた検査を `data-*` 属性の検査へ置き換える際に、バリアントを網羅する形にしたため。逆に `src/styles/*.spec.ts` 4 本（9 件）は対象の関数ごと無くなった。

## 描画結果を変えていないことの確認

2 つの経路で突き合わせ、**どちらも差分ゼロ**だった。

### 1. 計算後スタイル（`snapshot-computed-styles.ts` / `diff-computed-styles.ts`）

全 104 ストーリー × ライト / ダークを Chromium で描画し、要素ごとの `getComputedStyle` を移行前後で比較した。

```
比較: 104 ストーリー / 4408 要素 / 474 プロパティ

差分はありません
```

比較から外したのは 2 つだけである。

- `animation-name` … CSS Modules がスコープするため名前は必ず変わる。アニメーションの有無は別途比べている
- アニメーション中の要素の `transform` / `opacity` … 測る瞬間で値が動く。両方のスナップショットでアニメーションが走っているときだけ除外する

### 2. 状態 × プロパティ（`compare-selector-shapes.ts`）

計算後スタイルでは、`:hover` / `:focus-visible` のように操作しないと現れない状態、`::placeholder` / `::backdrop` のような擬似要素、`prefers-reduced-motion` 下のスタイルに届かない。ビルド済み CSS から「擬似クラス・擬似要素・メディアクエリ × 宣言プロパティ名」の多重集合を作って比べた。

```
before: 76 種 / 201 件、after: 76 種 / 201 件

「状態 × プロパティ」の組み合わせに差分はありません
```

セレクタ全体の形は比べていない。バリアントをクラスから `data-*` 属性へ変えたため、形の集合は意図的に変わっている。ここで見たいのは「`:disabled` の分岐を落としていないか」であって、ルールの区切り方ではない。

> 実装中に一度だけ差分が出た（`prefers-reduced-motion` の `animation` / `transition` が 2 件多い）。原因は移行ではなく比較側で、中身が同じ `@media` を minifier が `.a, .b { … }` へまとめるため、ルール単位で数えると片方を取りこぼしていた。セレクタ単位で数えるよう直して一致した。

## 途中で決めたこと

### バリアントは `data-*` 属性で表す

`styleVariants()` 15 箇所を `data-variant` / `data-size` / `data-status` などに置き換えた。既存の `data-selected` / `data-error` / `data-loading` と書き味が揃い、パーツの出し分けを親セレクタから書けるため、TSX 側で `buttonLabel[size]` のような受け渡しが要らなくなった。

### 入れ子にできるコンポーネントは子孫セレクタを使わない

`Card` は自身の内側へ自身を置ける。`.card[data-size='sm'] .card__body` は内側のパーツにも同じ詳細度で当たるため、勝敗が出力順で決まってしまう。継承するカスタムプロパティに余白を持たせ、内側の `Card` が上書きする形にした。

jsdom は `var()` を解決しないため、ユニットテストでは `data-size` が出ていることまでしか確かめられない。実際の余白は `Nested` ストーリーで担保している（外側 sm = 16px、内側 md = 24px を実ブラウザで確認済み）。

### モーション低減は共有しない

`reducedMotion` を `composes:` にすると、`@media` 内の `transition: none` とコンポーネントの `transition` が別クラスの宣言になり、勝敗がスタイルシートの出力順に依存する。移行前の実装が「同一ルール内に展開されるため順序に依存しない」ことを設計上の要点にしていたので、各モジュールへ直接書く形にした。

宣言だけで衝突しない 3 つ（`inputColorSchemeLight` / `interactiveTouch` / `truncate`）は `mixins.module.css` から `composes:` で引いている。

### `composes … from` は相対パスで書く

`@/` エイリアスは使えない。`composes … from` の解決は Vite の `resolve.tsconfigPaths` を通らず、`The returned path from the "fileResolve" option must be absolute` でビルドが落ちる。`resolve.alias` を足せば解決できるが、パスの対応を `tsconfig` と `vite.config.ts` の 2 箇所に持つことになるため採らなかった。

### クラス名の型は生成してコミットする

`vite/client` の `*.module.css` は `{ readonly [key: string]: string }` で、`styles.buttonn` のような綴り違いが型エラーにならず黙って「クラス未適用」になる。Vanilla Extract では export された値だったので型で守られていた箇所であり、CSS Modules 化で失う唯一の安全性がここだった。

`scripts/build-css-module-types.ts` が `*.module.css.d.ts` を生成する。クラス名は **Vite の `css.modules.getJSON` から受け取る**ので、`composes` の扱いも含めて実ビルドと必ず一致する。正規表現で CSS を掻き集める方式は採らなかった（失敗しても「クラスが 1 つ足りない `.d.ts`」が静かに出来上がるため）。

形式は `X.module.css.d.ts`。TypeScript 6 がこの形式をコンパイラオプションなしで解決し、`vite/client` の索引シグネチャより優先することを実測で確認した（TypeScript 5.0 以降の `X.module.d.css.ts` 形式は `allowArbitraryExtensions: true` を要するため採らなかった）。

生成物はコミットし、CI の `check:css-types` で鮮度を見る。生成は `pnpm build` に組み込んであるため、古いままコミットされても build は通ってしまう。

### 配布 CSS の固定版は `:root` の差し替えで作る

`light-dark()` を文字列で解決する 80 行の自作パーサを削除し、ビルド済み CSS から `:root { … }` を落として `variables-{light,dark}-only.css` を前置する形にした。コンポーネントは `:root` を使わないため、これで変数定義だけを正確に切り離せる。

`verify:dist` に「固定版に既定 CSS と同じ変数がそろっている」検査を足した。既存の `light-dark()` 検査は**落とし残し**しか見ておらず、**落としすぎ**（＝固定版から変数が消える）はファイルが出力されているぶん気づけない。

### `src/design-tokens/` を削除した

`createGlobalTheme` のためだけに生成していたもので、廃止で参照者がゼロになった。`build:tokens:ts-object` と `style-dictionary/build-css-variables-ts-object.ts` も併せて削除し、トークンの正は `figma/tokens.json` → `variables*.css` の 1 本になった。

## 見つけた既存の不具合

### Dialog / Tooltip のドロップシャドウが当たっていない（[#104](https://github.com/zukki30/zukki-design-system-react/issues/104)）

```css
box-shadow: var(--…-x) var(--…-y) var(--…-blur)px var(--…-spread) var(--…-color);
```

blur だけトークンの値が単位なしの `8` で、カスタムプロパティの置換はトークン単位で行われるため `var(--…-blur)px` は `8px` にならない。`box-shadow` は無効値となり宣言ごと破棄される。

基準スナップショットの **4,408 要素すべてが `box-shadow: none`** で、開いた状態の `Dialog` も含めてシャドウは元から出ていなかった。移行は「描画結果を変えない」ことを条件にしているため、`Dialog.module.css` / `Tooltip.module.css` には宣言を置かず、理由と追跡先をコメントに残した。見た目が変わる修正なので #104 で扱う。

### `ICON_SIZE` の二重管理

`Select` はアイコンサイズ `20` を `Select.tsx` と `Select.css.ts` の両方に持っていた（`Tag` は `.css.ts` から export して回避していた）。どちらもサイズの持ち主を CSS に寄せ、`<Icon>` から `width` / `height` を外した。CSS の指定は要素の `width` 属性より優先されるため、描画サイズは変わらない。

## 残っている道具

`docs/specs/migrate-to-css-modules/` に置いた 3 本は一度きりの道具で、`pnpm` スクリプトにも CI にも載せていない（`{src,scripts}` の外にあるため lint / format / typecheck の対象にもならない）。同じ種類の書き換えをするときに再利用できる。

| ファイル | 役割 |
| --- | --- |
| `snapshot-computed-styles.ts` | 全ストーリーを実ブラウザで描画し、計算後スタイルを JSON に記録する |
| `diff-computed-styles.ts` | 2 つのスナップショットを突き合わせる |
| `compare-selector-shapes.ts` | ビルド済み CSS の「状態 × プロパティ」を突き合わせる |

## 品質ゲート

```
lint:check       ✅
format:check     ✅
typecheck        ✅
check:css-types  ✅
test             ✅  437 passed
test:a11y        ✅  210 passed（ライト / ダーク両配色）
verify:dist      ✅  全 30 項目
```
