# 要件: install して使える配布物にする

対象 Issue: [#89 install して使える配布物にする（型宣言・エントリポイント・React の外部化）](https://github.com/zukki30/zukki-design-system-react/issues/89)

## 背景

このリポジトリは React のデザインシステムだが、**他のプロジェクトに install して使うことが現状できない**。`npm pack` で配布物を作り、ビルド成果物を実際に検査して確認した。

## 現状（実測値）

すべて `pnpm build` と `npm pack` を実行して確認した事実である。

### 配布物の中身

```
npm pack の結果: 315 ファイル
  src/              173 ファイル（TypeScript のソースそのまま）
  .codex/           101 ファイル（開発用の skills）
  style-dictionary/   8 / .storybook/ 6 / docs/ 5 / .github/ 5
  dist/               0 ファイル  ← ビルド成果物が 1 つも入らない
  *.d.ts              0 ファイル
```

`dist` は `.gitignore` に入っており `.npmignore` も `files` フィールドも無いため、npm は `.gitignore` を尊重して `dist/` を丸ごと除外する。結果として **実行できる JS が 1 つも含まれない**。

### package.json

| 項目 | 現状 |
| --- | --- |
| `private` | `true` — publish できない |
| `main` / `module` / `exports` / `types` | **すべて未定義** — import の解決先が無い |
| `files` | 未定義 |
| `react` / `react-dom` | `dependencies` かつ完全固定（`19.2.8`） |

### ビルド成果物

`dist/` には次が出力される。

| ファイル | サイズ |
| --- | --- |
| `zukki-design-system.es.js` | 75.27 kB |
| `zukki-design-system.umd.js` | 58.17 kB |
| `zukki-design-system.css` | 79.21 kB |
| `vite.svg` | `public/` から複製されたもの。ライブラリには不要 |
| `*.d.ts` | **0 ファイル** |

型宣言が出ないのは `tsconfig.app.json` が `noEmit: true` で、dts 生成プラグインも無いため。

### React がバンドルに同梱されている

`vite.config.ts` に `build.rollupOptions.external` の指定が無いため、React が成果物へ丸ごと取り込まれている。

```
ES バンドル内の外部 import         : 0 件（何も外部化されていない）
ES バンドル内の "from \"react\"" : 0 件
ES バンドル内の useSyncExternalStore : 4 件  ← React 本体の実装が混入している証拠
UMD の factory                     : (exports) のみを受け取る形（外部依存を受け取らない）
```

利用側のアプリが持つ React と二重に読み込まれ、`Invalid hook call` になる。

## 調査で新たに判明した問題

Issue 本文には記載が無いが、配布物として成立させるうえで無視できない問題を 2 件見つけた。

### A. ビルドで `light-dark()` がポリフィルへ変換され、挙動が変わる

ソースの `src/styles/variables.css` は 238 箇所で `light-dark()` を使っているが、**ビルド後の CSS には 1 つも残らない**。Vite の CSS 最適化（lightningcss）が次の形へ変換する。

```css
/* ソース */
--color-focus: light-dark(#0e70f1, #5b9ef5);

/* ビルド後 */
--color-focus: var(--lightningcss-light,#0e70f1) var(--lightningcss-dark,#5b9ef5);
```

切り替えは次の宣言が担う。

```css
:root{--lightningcss-light:initial;--lightningcss-dark: ;color-scheme:light dark}
@media (prefers-color-scheme:dark){:root{--lightningcss-light: ;--lightningcss-dark:initial}}
```

ポリフィル自体は破綻していないが、**ネイティブの `light-dark()` とは切り替えの条件が違う**。

| | ネイティブ `light-dark()` | ポリフィル後 |
| --- | --- | --- |
| 反応する対象 | 要素の `color-scheme` プロパティ | `prefers-color-scheme` メディアクエリのみ |
| 要素単位の上書き | できる | **できない** |

このリポジトリ自身が `.dark-theme { color-scheme: dark }` で配色を切り替えており（`.storybook/preview.tsx` の decorator、および #83 で入れた a11y 検査もこの経路を通る）、**開発時に検証している切り替え方法が配布物では機能しない**。利用側がコンテナ単位でダークに固定するといった使い方もできない。

`build.cssTarget` を `light-dark()` に対応したブラウザに設定すると変換は行われず、ネイティブのまま出力される。実測で確認した。

```
現状             : 79.21 kB / light-dark() 0 箇所
cssTarget 指定時 : 56.19 kB / light-dark() 保持
```

**副次的に CSS が 29% 小さくなる。**

### B. light-only / dark-only の CSS は、現状コンポーネントに一切効かない

`src/main.tsx` は 3 つの CSS を import している。

```ts
import './styles/variables-dark-only.css';
import './styles/variables-light-only.css';
import './styles/variables.css';
```

この 3 ファイルは **まったく同じ 312 個の変数を、同じ `:root` に対して定義している**（変数名の差分は 0 件）。CSS の後勝ちで最後の `variables.css` がすべてを上書きするため、前の 2 つは約 9.5 kB の到達しない宣言として残る。

**さらに深刻な問題がある。** ビルド後の CSS を解析したところ、トークンが二重の層になっていた。

| 層 | 出どころ | 数 | 例 | コンポーネントからの参照 |
| --- | --- | --- | --- | --- |
| 意味的な変数 | `styles/variables*.css`（style-dictionary 生成） | 312 | `--color-focus` | **0 回** |
| ハッシュ変数 | `styles/theme.css.ts` の `createGlobalTheme` | 312 | `--_1yvh1mm0` | **542 回** |

コンポーネントのスタイルが参照しているのは**ハッシュ変数だけ**である。そしてハッシュ変数の定義は、意味的な変数を参照せず**値をそのまま埋め込んでいる**。

```css
/* var(--color-focus) ではなく、リテラルが直接入っている */
--_1yvh1mm0: light-dark(#0e70f1, #5b9ef5);
```

これは `createGlobalTheme` に渡している `design-tokens/light-dark.ts` が `'light-dark(#0e70f1, #5b9ef5)'` という文字列リテラルを持っているためである。

**結果として、`variables-light-only.css` を読み込ませても `--color-focus` が変わるだけで、コンポーネントが見ている `--_1yvh1mm0` は変わらない。つまり light-only / dark-only は現状まったく機能しない。**

3 種類の CSS を配布するには、この二重層を解消するか、値を解決した CSS を生成する必要がある（FR-4 / 論点 2）。

## 機能要件

### FR-1: install して import できる

- 別プロジェクトから `import { Button } from 'zukki-design-system'` が解決できること
- ESM / CJS のどちらの解決経路でも壊れないこと
- `package.json` に `exports` / `types` / `files` を定義すること

### FR-2: 型宣言を配布する

- `.d.ts` を出力し、配布物に含めること
- 実装に書かれている日本語の JSDoc が利用側の補完に出ること
- `main.tsx` から export しているすべての型が参照できること

### FR-3: React を外部化する

- `react` / `react-dom` / `react/jsx-runtime` をバンドルに含めないこと
- ES / UMD の両方で外部依存として扱われること
- `react` / `react-dom` を `peerDependencies` へ移し、範囲指定にすること

### FR-4: 3 種類の CSS を配布し、`light-dark()` で切り替えられるようにする

利用側が配色の扱いを選べるよう、**次の 3 つをすべて配布する**。それぞれ `exports` から個別に import できること。

| 配布物 | 用途 | 配色の決まり方 |
| --- | --- | --- |
| 既定 | ライト / ダークの両対応 | `light-dark()` が `color-scheme` に従って解決する |
| light-only | ライトに固定 | 常にライトの値 |
| dark-only | ダークに固定 | 常にダークの値 |

要件は次のとおり。

- 既定の CSS で **`light-dark()` がネイティブのまま保持されること**（上記 A）。ポリフィルへの変換を許容しない
- 既定の CSS を使ったとき、利用側が **`color-scheme` プロパティで配色を切り替えられること**。OS の設定（`prefers-color-scheme`）に追従するだけでなく、要素単位で `color-scheme: dark` を指定して固定できること
- **light-only / dark-only が実際にコンポーネントの見た目を変えること**（上記 B）。現状これらは効かないため、二重層の解消または値を解決した CSS の生成が必要
- 3 つの内容が食い違わないこと。トークンを更新したときに一部だけ古いままにならない作りにする

### FR-5: 配布物を必要なファイルだけに絞る

- `.codex/` `.storybook/` `docs/` `.github/` `style-dictionary/` `figma/` を含めないこと
- `src/` を含めるかは判断のうえ決める（sourcemap 経由のデバッグ用途との兼ね合い）
- `dist/` が確実に含まれること
- `public/vite.svg` が成果物に混ざらないこと

### FR-6: 実際に install して動作を確認する

**この要件が本 spec の核心である。** 設定を書いただけでは「使える」ことの保証にならない。

別プロジェクトを用意して、次を実際に確認すること。

- `import` が解決できる
- 型が効き、存在しない prop がエラーになる
- CSS を import するとスタイルが当たる
- **フックが動く**（React 二重読み込みが起きていない）
- ダークモードが `color-scheme` で切り替わる

## 非機能要件

### NFR-1: 既存の開発フローを壊さない

- `pnpm dev`（Storybook）が従来どおり動くこと
- `pnpm test` / `pnpm test:a11y` が従来どおり成功すること
- `pnpm lint:check` / `format:check` / `typecheck` が成功すること

### NFR-2: CI で配布物の健全性を検証する

設定は一度直せば終わりだが、**壊れたことに気づけない状態は避ける**。ビルドと配布物の検証を CI に載せること。

### NFR-3: ドキュメント

- 配布の前提（CSS の import が必須であること）を `README.md` に記載すること
- 判断を伴った設定にはコメントで理由を残すこと

## スコープ外

- **Props 型の export 追加、README の usage 拡充、利用側エージェント向けガイド** — [#90](https://github.com/zukki30/zukki-design-system-react/issues/90) の範囲。本 spec は「型が届く器を作る」ところまでを担い、「何を型として公開するか」は #90 で扱う
- **CSS Modules への移行** — [#84](https://github.com/zukki30/zukki-design-system-react/issues/84)。本対応と独立に行える
- **npm レジストリへの実際の publish** — 公開するかどうかは運用判断。本 spec は「publish できる状態にする」までとする
- 既存の `pnpm test:coverage` の不備（`@vitest/coverage-v8` 未インストール）

## 判断が必要な論点

設計フェーズで決める。現時点での論点を明示しておく。

1. **`private: true` を外すか** — npm publish する運用にするのか、git install 前提のままにするのか。後者なら `prepare` スクリプトでのビルドが必要になる

2. **3 種類の CSS をどう作るか（FR-4 の実現方法）** — 現状 light-only / dark-only は効かないため、次のいずれかが必要になる。設計フェーズで決める

   | 案 | 内容 | 評価の観点 |
   | --- | --- | --- |
   | 派生生成 | 既定の CSS を 1 回ビルドし、そこから `light-dark(a, b)` を `a` / `b` に解決した 2 ファイルを生成する | 出どころが 1 つなので 3 つが食い違わない。ソースに手を入れず、#84 の影響も受けない |
   | 参照化 | `createGlobalTheme` が値を埋め込まず `var(--color-focus)` を参照するようにする | 二重層そのものが消えて CSS が小さくなる。ただしトークンのパイプラインに手が入り、#84 と重複する可能性がある |
   | 複数ビルド | トークンを差し替えて 3 回ビルドする | 素直だが遅く、成果物の同期を別途保証する必要がある |

3. **CJS を出すか** — 現状の UMD を維持するのか、CJS へ置き換えるのか
4. **`src/` を配布物に含めるか**

## 受け入れ条件

- [ ] `npm pack` の中身に `dist/` が含まれ、不要なディレクトリが含まれない
- [ ] 配布物に `.d.ts` が含まれる
- [ ] ES / UMD の両方で React が外部化されている（バンドル内に React 実装が無い）
- [ ] `react` / `react-dom` が `peerDependencies` にあり範囲指定である
- [ ] 既定の配布 CSS に `light-dark()` がネイティブのまま含まれる
- [ ] 既定 / light-only / dark-only の 3 つが `exports` から import できる
- [ ] **3 つそれぞれで実際にコンポーネントの色が変わることを確認した**（light-only でダーク配色にならない、など）
- [ ] **別プロジェクトに install し、import・型・スタイル・フック・配色切り替えが動作することを実際に確認した**
- [ ] 既定の CSS で、要素に `color-scheme: dark` を指定して配色が切り替わることを確認した
- [ ] `pnpm dev` / `test` / `test:a11y` / `lint:check` / `format:check` / `typecheck` がすべて成功する
- [ ] 配布物の健全性が CI で検証される
- [ ] `README.md` に install と CSS import の手順がある
