# 実装計画: CSS を入れ子（CSS Nesting）で書く

対象 Issue: [#117](https://github.com/zukki30/zukki-design-system-react/issues/117) / 要件: [requirements.md](./requirements.md) / 設計: [design.md](./design.md)

ブランチ: `chore/css-nesting`（`origin/main` の `098bb70` から派生）

## 進め方

**検証の足場を先に作り、変更前の状態を記録してから書き換える。** 書き換えを始めてしまうと「変更前」が取れなくなるため、順序を入れ替えない。

書き換えは 1 コミット = 1 グループとし、**各コミットの前に必ず `compare-flat-css.ts` を通す**。差分が出た時点で原因が直前のグループに限定されるため、314 ルールをまとめて書き換えて最後に照合するより追跡が容易になる。

## フェーズ 1: 検証の足場（書き換え前に必ず終わらせる）

### 1-1. `compare-flat-css.ts` を作る

`docs/specs/css-nesting/compare-flat-css.ts`。設計 §4.1 のとおり。

| 引数 | 動作 |
| --- | --- |
| `--out <path>` | 現在の `src/**/*.module.css` をビルドし、フラット展開した結果を JSON で書き出す |
| `--compare <before> <after>` | 2 つの JSON を突き合わせ、宣言の差分と順序の入れ替わりを報告する |

実装の要点。

- `vite.build({ configFile: false, logLevel: 'error', css: { modules: { getJSON } }, build: { write: false, minify: true, cssTarget: ['chrome100'], lib: { entry, formats: ['es'] } } })`
  - 一時エントリは `.tmp/` に作り、`scripts/build-css-module-types.ts` と同じ形で全 `*.module.css` を import する
  - `cssTarget: ['chrome100']` で esbuild が入れ子をフラットへ展開する。`minify: true` でないと展開が走らない（検証済み）
- `getJSON` の `{ 元のクラス名: 生成名 }` を分解し、生成名 → 元のクラス名の対応表を作る。`composes` があると生成名が空白区切りで複数になるため、全トークンを登録する
- 出力 CSS のハッシュ付きクラス名を対応表で戻し、`{ selector, declarations }` の配列に分解する。`@keyframes` は 1 ブロックとしてそのまま持つ
- `--compare` の判定
  - **宣言の差分**（ルールの増減 / 宣言の増減・変化）→ 異常終了
  - **順序の入れ替わり** → 詳細度・当たる要素・触るプロパティの 3 点で衝突を判定し、衝突があれば異常終了。無ければ件数だけ報告して正常終了
  - 詳細度は `:not()` / `:is()` / `:has()` の中身の最大を採る。`:where()` は 0
  - 当たる要素は一番右の複合セレクタが持つクラスで見る

**コミット**: `chore: add a tool to compare the flattened CSS around the nesting change`

### 1-2. 変更前の状態を記録する

```bash
pnpm exec tsx docs/specs/css-nesting/compare-flat-css.ts --out .tmp/flat-before.json

pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts --out .tmp/nest-before.json
```

`.tmp/` は Git 管理外。**このブランチの作業中は消さない。**

## フェーズ 2: 書き換え

各グループの手順は共通。

1. 対象ファイルを設計 §1 の規則 1〜6 に沿って書き換える
2. `pnpm exec tsx docs/specs/css-nesting/compare-flat-css.ts --out .tmp/flat-after.json`
3. `pnpm exec tsx docs/specs/css-nesting/compare-flat-css.ts --compare .tmp/flat-before.json .tmp/flat-after.json`
4. 差分ゼロを確認してコミット

グループ分けは「似た形が続くもの」をまとめ、レビューしやすい単位にした。カッコ内は現在のルール数 → 入れ子後のトップレベル数。

| # | グループ | 対象 | コミットメッセージ |
| --- | --- | --- | --- |
| 2-1 | 小さいもの | `Skeleton`(2→1) / `Spinner`(5→1) / `Steps`(3→1) / `TextArea`(8→1) | `refactor: nest the small component stylesheets` |
| 2-2 | Button 系 | `Button`(47→4) / `IconButton`(24→3) | `refactor: nest the Button and IconButton stylesheets` |
| 2-3 | Tag | `Tag`(30→3) | `refactor: nest the Tag stylesheet` |
| 2-4 | Tooltip / Breadcrumb | `Tooltip`(19→3) / `Breadcrumb`(13→8) | `refactor: nest the Tooltip and Breadcrumb stylesheets` |
| 2-5 | 面を持つもの | `Card`(8→7) / `Dialog`(8→6) | `refactor: nest the Card and Dialog stylesheets` |
| 2-6 | 入力欄 | `Input`(15→3) / `InputNumber`(22→5) / `Select`(16→3) | `refactor: nest the text input stylesheets` |
| 2-7 | 選択系 | `Checkbox`(20→8) / `Radio`(16→6) / `Switch`(17→6) | `refactor: nest the Checkbox, Radio and Switch stylesheets` |
| 2-8 | 残り | `FormField`(14→8) / `StepsItem`(24→5) | `refactor: nest the FormField and StepsItem stylesheets` |

`src/styles/mixins.module.css` は 3 クラスとも宣言のみで、ネストする対象が無いため**変更しない**（要件 R5）。

### 書き換え時の注意

| 項目 | 内容 |
| --- | --- |
| `composes` | トップレベルのルール直下の先頭へ。ネストの中に書くとビルドが落ちる |
| `@media (prefers-reduced-motion: reduce)` | 現状どおり、その宣言を持つルールの中に直接置く。ネストしたルールより前 |
| `@keyframes` | トップレベルのまま動かさない（`Skeleton` / `Spinner`） |
| コメント | 対応するネストの位置へそのまま運ぶ。内容は変えない |
| セクション見出し | 入れ子自体が区切りになる箇所（`Button` の `/* ---- バリアント */` など）は削ってよい |
| 宣言の整理 | **しない。** 共通化・順序の入れ替え・トークンの付け替えは非対象 |

## フェーズ 3: 規約の更新

### 3-1. `AGENTS.md` を改訂する

設計 §5 のとおり。「スタイリング（CSS Modules）」の節へ入れ子の規約を追加し、既存の `data-*` と `Card` のカスタムプロパティの例を入れ子の形に書き換える。

**コミット**: `docs: document the CSS nesting convention`

## フェーズ 4: 検証

### 4-1. 全体の照合

```bash
pnpm exec tsx docs/specs/css-nesting/compare-flat-css.ts --out .tmp/flat-after.json
pnpm exec tsx docs/specs/css-nesting/compare-flat-css.ts --compare .tmp/flat-before.json .tmp/flat-after.json
```

宣言の差分が 0 であること。順序の入れ替わりは件数と「衝突なし」の判定を記録する。

### 4-2. 計算後スタイルの突き合わせ

```bash
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts --out .tmp/nest-after.json
pnpm exec tsx docs/specs/migrate-to-css-modules/diff-computed-styles.ts .tmp/nest-before.json .tmp/nest-after.json
```

全ストーリー × ライト / ダークで差分ゼロであること。

> 実際には、このスクリプトが**描画途中を測っていた**ことが分かったため、待ちを足した写しで測っている。経緯は [results.md](./results.md) を参照。

### 4-3. 既存の検査

```bash
pnpm check:css-types   # 差分が出ないこと（出たらクラスを増減させている）
pnpm lint:check
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:a11y
pnpm verify:dist
```

### 4-4. 出力 CSS を目で 1 度確認する

`pnpm build` 後の `dist/styles.css` に入れ子がそのまま残っていること（`cssTarget` が効いていること）と、`light-dark()` が保持されていることを確認する。ここが崩れると配布 CSS の要件（`AGENTS.md` の「配布物」）に触れる。

## フェーズ 5: まとめ

### 5-1. `results.md` を書く

`docs/specs/css-nesting/results.md`。他の spec と同じ形式で、次を記録する。

- 実際のルール数の変化（314 → 85 の実測値）
- 順序が入れ替わったペアの件数と、衝突なしと判定した根拠
- 検証の結果
- 書き換え中に見つかった想定外（あれば）

**コミット**: `docs: record the outcome of the CSS nesting work`

### 5-2. PR を作る

`AGENTS.md` の「Pull Request」に従う。

- 利用者から見た変化: **無い**（描画結果は同一）。ただし出力 CSS に入れ子が残るため、対応ブラウザの前提を PR に明記する
- 破壊的変更: 無し
- トークンの再生成: 無し
- 検証結果（フェーズ 4）を貼る

## チェックリスト

- [x] 1-1 `compare-flat-css.ts` を作る
- [x] 1-2 変更前の `.tmp/flat-before.json` と `.tmp/nest-before.json` を取る
- [x] 2-1 小さいもの（Skeleton / Spinner / Steps / TextArea）
- [x] 2-2 Button / IconButton
- [x] 2-3 Tag
- [x] 2-4 Tooltip / Breadcrumb
- [x] 2-5 Card / Dialog
- [x] 2-6 Input / InputNumber / Select
- [x] 2-7 Checkbox / Radio / Switch
- [x] 2-8 FormField / StepsItem
- [x] 3-1 `AGENTS.md`
- [x] 4-1 フラット CSS の照合（差分 0）
- [x] 4-2 計算後スタイルの突き合わせ（差分 0）
- [x] 4-3 既存の検査をすべて通す
- [x] 4-4 `dist/styles.css` の目視確認
- [x] 5-1 `results.md`
- [x] 5-2 PR
