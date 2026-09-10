# 実装計画: スタイリングを Vanilla Extract から CSS Modules へ移行する

対象 Issue: [#84](https://github.com/zukki30/zukki-design-system-react/issues/84)
前提: [requirements.md](./requirements.md) / [design.md](./design.md)

ブランチ: `chore/migrate-to-css-modules`（`main` から派生済み）

## 進め方の骨子

**コンポーネント 1 つを移行するたびに、そのコンポーネントのストーリーだけを計算後スタイルで突き合わせる。** 全部書き換えてから最後に diff を取ると、差分が出たときに 19 個のうちどれが原因か切り分けられない。

これは移行中に Vanilla Extract と CSS Modules が同居できるから成立する。

- 未移行のコンポーネント … `.css.ts` → ハッシュ変数（`--_xxx`）で描画される
- 移行済みのコンポーネント … `.module.css` → 意味的な変数（`--color-*`）で描画される
- Storybook は Phase 1 で `variables.css` を読み始めるので、両方が同時に正しく描画される

---

## Phase 0: 基準スナップショットを取る

`main` の描画結果を記録する。ここを取り違えると以降の比較が全部無意味になるので、**コード変更前に** 行う。

### 0-1. スナップショットツールを書く

`docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts`

`pnpm` スクリプトには登録しない。一度きりの道具であり、`{src,scripts}` の外に置くことで lint / format / typecheck の対象からも外れる。

やること:

1. `storybook-static/index.json` から全ストーリー id を読む
2. 静的ファイルをローカルで配信する（`node:http` で十分）
3. Playwright（Chromium）で `iframe.html?id=<id>&globals=theme:<light|dark>` を開く
4. ルート要素から DOM を歩き、要素ごとに次を記録する
   - 要素パス（`div > button:nth-child(1)` のような安定した経路）
   - `getComputedStyle` の値。**対象プロパティは引数で渡す**
5. `{ [storyId]: { [theme]: { [elementPath]: { [prop]: value } } } }` を JSON で書き出す

対象プロパティは、ビルド済み CSS に実際に現れるものだけに絞る。全プロパティを取ると JSON が肥大し、ブラウザ既定値の差（フォント読み込みタイミングなど）でノイズも増える。

引数:

```bash
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts \
  --out .tmp/snapshot-before.json \
  [--stories button-*,card-*]     # 省略時は全ストーリー
```

### 0-2. 比較ツールを書く

同ディレクトリに `diff-computed-styles.ts`。2 つの JSON を読み、`storyId / theme / elementPath / prop` の単位で差分を出す。ストーリー id で絞り込めるようにする。

### 0-3. 基準を取得する

```bash
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts --out .tmp/snapshot-before.json
```

- [ ] 104 ストーリー × ライト / ダークの 208 件が記録されている
- [ ] 目視で 1 件開き、`background-color` などが `rgb(…)` に解決されている（`var(…)` のまま残っていない）

> **注意** `.tmp` は gitignore 対象。ブランチを切り替えても消えないので基準として使える。

---

## Phase 1: 土台を用意する

### 1-1. 固定版の変数ファイルに `color-scheme` を入れる

`style-dictionary/utils.ts` の `cssFileDefaultCofig` が使う format を、`build-css-variables-to-files.ts` と同じ形の自前 format に差し替える。

```css
:root {
  color-scheme: light;
}

:root {
  --color-focus: #0e70f1;
  …
}
```

```bash
pnpm build:tokens:css-only
```

- [ ] `src/styles/variables-light-only.css` の先頭に `color-scheme: light` がある
- [ ] `src/styles/variables-dark-only.css` の先頭に `color-scheme: dark` がある
- [ ] 変数の中身は差分なし（`git diff` で `color-scheme` の追加だけが出る）

### 1-2. 共有 mixin を CSS Modules へ移す

`src/styles/mixins.module.css` を作る。クラスは `inputColorSchemeLight` / `interactiveTouch` / `truncate` の 3 つ。既存 4 ファイルの JSDoc に書かれている理由を CSS コメントとして引き継ぐ。

`motion.ts` は移さない。各コンポーネントに `@media (prefers-reduced-motion: reduce)` を直書きする（design.md §5.2）。

このフェーズでは **まだ `src/styles/*.ts` を消さない**。未移行のコンポーネントが参照しているため。

### 1-3. 型生成スクリプトを書く

`scripts/build-css-module-types.ts`

- `src/**/*.module.css` を集める
- 全部を import する一時ファイルを `.tmp/` に書く
- `vite` の `build()` を `write: false` で走らせ、`css.modules.getJSON` でクラス名を集める
- 各 CSS の隣に `X.module.css.d.ts` を書く
- `--check` のときは書き込まず、既存と比較して差があれば異常終了する

出力は Prettier のルールに合わせる（`format:check` の対象に入るため）。

`package.json`:

```json
"build:css-types": "tsx scripts/build-css-module-types.ts",
"build": "pnpm build:css-types && tsc -b && vite build && …"
```

- [ ] `pnpm build:css-types` が `src/styles/mixins.module.css.d.ts` を出す
- [ ] 生成物が `pnpm format:check` を通る
- [ ] `--check` が、ファイルを 1 行削ってから走らせると異常終了する

### 1-4. Storybook に `variables.css` を読ませる

`.storybook/preview.tsx` の先頭に `import '../src/styles/variables.css';` を足す。**`preview.css.ts` はまだ触らない**（Phase 3 で置き換える）。

これで移行済みコンポーネントが Storybook で正しく描画される。

- [ ] `pnpm dev` で既存のストーリーの見た目が変わらない（変数が二重に載るだけで、参照しているのはハッシュ変数のまま）

---

## Phase 2: コンポーネントを移行する（19 個）

### 各コンポーネントの手順

1. `ComponentName.module.css` を書く（変換規則は design.md §4）
2. `ComponentName.tsx` の import を `import styles from './ComponentName.module.css'` に変え、クラス参照と `data-*` を直す
3. `.stories.tsx` / `.spec.tsx` がクラス名を import していれば直す
4. `ComponentName.css.ts` を削除する
5. `pnpm build:css-types` を走らせる
6. `pnpm test --project unit` の当該 spec を通す
7. **そのコンポーネントのストーリーだけスナップショットを取り、Phase 0 の基準と突き合わせる**

```bash
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts \
  --out .tmp/snapshot-button.json --stories 'button-*'
pnpm exec tsx docs/specs/migrate-to-css-modules/diff-computed-styles.ts \
  .tmp/snapshot-before.json .tmp/snapshot-button.json --stories 'button-*'
```

- [ ] 差分ゼロ

### 移行の順序

似た構造をまとめて、変換パターンを 1 つずつ確立していく。

| # | 対象 | 行数 | このグループで確立するパターン |
| --- | --- | --- | --- |
| 1 | `Spinner` | 35 | `@keyframes`、`data-variant`、`@media` 直書き、`stroke-width: 2px` |
| 2 | `Skeleton` | 24 | `@keyframes`、既存の `data-shape` |
| 3 | `Breadcrumb` | 79 | `composes: truncate`、`a&:hover` → `a.block:hover`、`data-current` |
| 4 | `Tag` | 162 | `data-variant` 8 種、`::after`、`composes` 2 種、閉じるボタンのサイズを CSS へ寄せる（design.md §4.6） |
| 5 | `Button` | 282 | `data-variant` × `data-size` の掛け合わせ、パーツを親セレクタから引く |
| 6 | `IconButton` | 137 | 同上。`primary-exposed` のようなハイフン入り属性値 |
| 7 | `Card` | 118 | `data-size` をルートへ集約（現在はパーツごとに受けている） |
| 8 | `Dialog` | 88 | `::backdrop`、`[open]`、`box-shadow` の elevation |
| 9 | `Tooltip` | 149 | `data-placement` 8 種 × 矢印、`anchor()`、ローカル定数 |
| 10 | `FormField` | 121 | 同一ファイル内 `composes`、`data-orientation` |
| 11 | `Steps` | 27 | `data-orientation` |
| 12 | `StepsItem` | 186 | `::after`、祖先セレクタの限定、`composes: truncate`、`data-status` |
| 13 | `Input` | 92 | `composes: inputColorSchemeLight`、`::placeholder`、`data-position` |
| 14 | `TextArea` | 58 | 同上 |
| 15 | `InputNumber` | 144 | 同上 + `::-webkit-inner-spin-button` |
| 16 | `Select` | 107 | `globalStyle` → 素の `option` セレクタ、`:has()` |
| 17 | `Checkbox` | 138 | 兄弟セレクタ（`input:checked + .box`）、同一ファイル `composes` |
| 18 | `Radio` | 115 | 同上 |
| 19 | `Switch` | 115 | 同上 + カスタムプロパティでの `calc()`（design.md §4.5） |

### 各コンポーネントの注意点

数値リテラルの単位は design.md §4.4 の一覧を、ローカル定数は §4.5 を都度参照する。とくに以下は見落としやすい。

| コンポーネント | 見落としやすい点 |
| --- | --- |
| `Spinner` | `strokeWidth: 2` は `2px` に出力されている。`stroke-width: 2` と書くと値が変わる |
| `Tag` | `CLOSE_BUTTON_SIZE` を `Tag.tsx` が import している。CSS へ寄せて `<Icon>` から props を外す |
| `Card` | `size` は context 経由でパーツへ配られている。ルートの `data-size` に集約する |
| `Tooltip` | `maxWidth: 240` → `240px`。`gap` / `edgeOffset` は `var(--spacing-sm)` / `var(--spacing-md)` をそのまま `calc()` に入れる |
| `StepsItem` | `margin: -1` → `-1px`、`height: 20` → `20px`、`width/height: 1` → `1px` |
| `InputNumber` | `minWidth: 80` → `80px`、`width: 22` → `22px`、`height: 1` → `1px`、`borderInlineStartWidth: 1` → `1px` |
| `Select` | `globalStyle` 3 本が `.select__field option` などの素のセレクタになる |
| `Switch` | `THUMB_TRAVEL` は導出値。カスタムプロパティ + `calc()` で意図を残す |
| すべて | `borderWidth: 1` → `border-width: 1px` |

---

## Phase 3: Storybook を切り替える

### 3-1. `preview.css.ts` を `preview.css` に置き換える

素の CSS で `.light-theme` / `.dark-theme` / `body` を書く（design.md §8.2）。`preview.tsx` の import 先を `./preview.css` のまま維持できる。

`preview.tsx` の decorator と `globalTypes` は変えない。

- [ ] `pnpm dev` でツールバーの配色切り替えが効く
- [ ] ダーク側でキャンバス背景が `--color-surface-page` のダーク値になる

---

## Phase 4: Vanilla Extract を撤去する

このフェーズは Phase 2 が 19 個すべて終わってから行う。

### 4-1. 参照が残っていないことを確かめる

```bash
grep -rn "vanilla-extract\|\.css\.ts\|styles/theme.css" src .storybook scripts
```

### 4-2. 削除する

- `src/styles/theme.css.ts`
- `src/styles/{colorScheme,interactive,motion,text}.ts` と対応する `.spec.ts` 4 本
- `src/design-tokens/` 5 ファイル
- `style-dictionary/build-css-variables-ts-object.ts`
- `src/main.tsx` の `import './design-tokens/*'` 5 行

### 4-3. 設定から外す

- `vite.config.ts` … `vanillaExtractPlugin()` と import
- `package.json` … `@vanilla-extract/css` / `@vanilla-extract/vite-plugin`、`build:tokens:ts-object`、`build:tokens` の連結から `ts-object` を外す

```bash
pnpm install
```

- [ ] `pnpm typecheck` が通る
- [ ] `pnpm test` が通る
- [ ] `pnpm lint:check` / `pnpm format:check` が通る

---

## Phase 5: 配布物のビルドを作り替える

### 5-1. `scripts/build-css-variants.ts`

`resolveLightDark()`（80 行の自作パーサ）を削除し、`:root` ルールの差し替えに置き換える（design.md §7.2）。

```
styles.css       = ビルド済み CSS をリネームしただけ
styles-light.css = ビルド済み CSS から :root { … } を全部落とし、variables-light-only.css を前置
styles-dark.css  = 同上（dark）
```

`:root` を落とすときは、`:root{` から対応する `}` までを数える。コンポーネント側は `:root` を使わないため、これで変数定義だけを正確に切り離せる。落とした個数が 0 なら異常として例外を投げる（前置だけして中身が二重になる事故を防ぐ）。

`styles*.css.d.ts` の出力は現状のまま。

### 5-2. ビルドと検査

```bash
pnpm build
pnpm verify:dist
```

- [ ] `verify:dist` の全項目が ✅
- [ ] `dist/styles.css` に `light-dark(` が残っている
- [ ] `dist/styles-light.css` / `styles-dark.css` に `light-dark(` が無く、`color-scheme` が固定されている
- [ ] `dist/styles-light.css` と `styles-dark.css` の `--color-surface-raised` が違う値
- [ ] `dist/` に `.module.css.d.ts` が紛れ込んでいないか確認する。混ざる場合は `tsconfig.build.json` で除外する

### 5-3. CI に型の鮮度検査を足す

`.github/workflows/ci.yml` の `check` マトリクスに `build:css-types --check` に相当するタスクを足す。マトリクスは `pnpm ${{ matrix.task }}` を実行する形なので、`package.json` に次を足してタスク名として並べる。

```json
"check:css-types": "tsx scripts/build-css-module-types.ts --check"
```

- [ ] `.module.css` を編集して `.d.ts` を再生成せずにいると CI 相当のコマンドが落ちる

---

## Phase 6: 全体を検証する

### 6-1. 計算後スタイルの全件突き合わせ

```bash
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts --out .tmp/snapshot-after.json
pnpm exec tsx docs/specs/migrate-to-css-modules/diff-computed-styles.ts \
  .tmp/snapshot-before.json .tmp/snapshot-after.json
```

- [ ] **差分ゼロ**

差分が出たら原因を特定して直す。「これは許容できる差」と判断する場合は、理由を `results.md` に残す。

### 6-2. セレクタ集合の突き合わせ

計算後スタイルでは `:hover` / `:focus-visible` / `:disabled` や `prefers-reduced-motion` 下のスタイルが見えない（design.md §11.2）。ビルド済み CSS から次を抽出し、移行前後で集合が一致することを見る。

- セレクタ末尾の擬似クラス・擬似要素・属性セレクタの組み合わせ
- そのルールが宣言しているプロパティ名の集合

クラス名は移行前後で対応が付かないため、**コンポーネント単位で集計した「セレクタの形 × プロパティ名」の多重集合** を比べる。値は比べない。

- [ ] 移行前後で集合が一致する。差がある場合は 1 件ずつ理由を説明できる

### 6-3. 品質ゲート

```bash
pnpm lint:check
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:a11y
pnpm verify:dist
```

- [ ] すべて通る
- [ ] `test:a11y` の違反件数が移行前と同じ（`color-contrast` が 1 件も増えていない）

### 6-4. 型安全性の確認

- [ ] `styles.button__labell` のような綴り違いが型エラーになる
- [ ] `.module.css` にクラスを足して `pnpm build:css-types` を走らせると `.d.ts` に現れる

---

## Phase 7: ドキュメントを更新する

### 7-1. `AGENTS.md`

| 節 | 変更内容 |
| --- | --- |
| アーキテクチャ | 「TypeScript と Vanilla Extract（CSS-in-JS）で構築した」→ CSS Modules |
| 技術スタック | `Vanilla Extract` → `CSS Modules` |
| デザイントークンのパイプライン | `src/design-tokens/*.ts` と `theme.css.ts` の段を落とし、`variables*.css` に一本化 |
| コンポーネント構成 | `ComponentName.css.ts` → `ComponentName.module.css` + 生成される `.d.ts` |
| コーディング規約（スタイリング） | `@vanilla-extract/css` → `.module.css`。`vars` → `var(--…)`。`styleVariants()` → `data-*` 属性。BEM の書き方。共有 mixin と `composes:`。`reducedMotion` を直書きする理由。数値に単位を書くこと |
| コマンド | `build:css-types` / `check:css-types` を追加 |
| 配布物 | 固定版 CSS の作り方（ハッシュ変数の説明を差し替える） |

**「配色を固定した CSS は…ハッシュ変数（`--_xxx`）まで解決する必要がある」の段落は削除する。** ハッシュ変数が無くなり、意味的な変数を差し替えれば見た目が変わるようになるため、記述が逆になる。

### 7-2. `README.md`

技術スタックの記述を更新する。

### 7-3. `docs/agent-guide.template.md`

Vanilla Extract 前提の記述があれば直す。利用側は CSS を読み込むだけなので、影響は無い見込み。

```bash
pnpm build:agent-guide && pnpm verify:dist
```

### 7-4. `results.md`

このディレクトリに、やったこと・数値・判断した差分を残す。

---

## 完了条件

- [ ] Phase 6 のチェックがすべて通る
- [ ] `git grep vanilla-extract` が `docs/specs/` 以外に当たらない
- [ ] `.css.ts` がリポジトリに 1 つも無い
- [ ] 公開 API（`src/main.tsx` の export）に差分が無い

## 想定外に備える

| 起きうること | どうするか |
| --- | --- |
| `composes` を含むクラスで `toHaveClass` が期待どおりに動かない | `styles.x.split(' ')` で分解して個別に検査する。それでも噛み合わなければ `composes` をやめて直書きに落とす |
| ネストした `@media` がテスト環境（jsdom）で扱えない | jsdom はメディアクエリを評価しないため元々検査対象外。`test:a11y` の実ブラウザ側で見る |
| スナップショットにフォント読み込み由来のノイズが出る | 対象プロパティから `font-family` の解決結果を外すか、`page.waitForFunction(() => document.fonts.ready)` を待つ |
| `.module.css.d.ts` が `dist/` に混ざる | `tsconfig.build.json` の `exclude` に `src/**/*.module.css.d.ts` を足す |
| Storybook のビルドが CSS Modules で遅くなる | 計測してから対処する。Vanilla Extract より速くなる見込みで、遅くなる理由は無い |
