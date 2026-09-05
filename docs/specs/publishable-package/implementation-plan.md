# 実装計画: install して使える配布物にする

対象要件: [`requirements.md`](./requirements.md) / 対象設計: [`design.md`](./design.md)

## 前提

- 作業ブランチ: `fix/publishable-package`（`origin/main` から作成済み）
- 各フェーズの末尾に**検証ゲート**を置き、通過してから次へ進む
- フェーズ単位でコミットする。メッセージは英語・プレフィックス付き
- 設計フェーズで `vite-plugin-dts` は導入済み（プローブ検証のため）。`tsconfig.build.json` も暫定版が残っているので、フェーズ 1 で正式なものに整える

## フェーズ構成の考え方

**フェーズ 4 の install 実地検証が本 spec の合否を決める。** それ以前のフェーズは、その検証を可能にするための準備という位置づけ。

設定変更のうちリスクが高いのは `"type": "module"`（既存の設定ファイル群の解釈が変わる）なので、実地検証の直前に置いて影響を切り分けられるようにする。

```
1. ビルドパイプライン      … dts / 外部化 / cssTarget / publicDir
2. CSS 3 種類の生成        … 派生生成スクリプト
3. package.json の配布設定 … exports / files / peerDeps / prepare / type ★リスク
4. install 実地検証        … ★合否を決めるゲート
5. CI
6. ドキュメント
```

---

## フェーズ 1: ビルドパイプライン（FR-2 / FR-3 / FR-4 の一部 / FR-5 の一部）

### 1-1. `tsconfig.build.json` を整える

型出力専用の設定。`tsconfig.app.json` を継承し、`noEmit` を外す。

- `declaration: true` / `emitDeclarationOnly: true` / `declarationMap: true`
- `types: []` … テスト用の型（`vitest/globals` 等）を配布物の型に混ぜない
- `exclude` に `*.spec.ts` / `*.spec.tsx` / `*.stories.tsx`

`tsconfig.json` の `references` に追加するかは、`tsc -b`（`pnpm typecheck`）の対象を増やさない判断で決める。**型出力はビルド時のみ行い、typecheck の経路は変えない。**

### 1-2. `vite.config.ts` を更新

- `vite-plugin-dts` を追加（`tsconfigPath: './tsconfig.build.json'`）
- `build.rollupOptions.external` に `react` / `react-dom` / `react/jsx-runtime`
- `output.globals` に 3 つとも指定（`react/jsx-runtime` を忘れると `MISSING_GLOBAL_NAME` 警告）
- `build.cssTarget: 'chrome123'`
- `publicDir: false`

判断を伴う設定（`cssTarget` / `publicDir`）には理由をコメントで残す。

### 検証ゲート 1

```bash
pnpm build
```

成果物を検査する。

| 確認項目 | 期待値 |
| --- | --- |
| `.d.ts` の生成数 | 100 前後 |
| `.d.ts` に `@/` が残っていないか | 0 件 |
| ES バンドルの React import | `from "react"` が存在する |
| バンドル内の `useSyncExternalStore` | **0 件**（React 実装が混入していない） |
| CSS の `light-dark()` | 348 箇所前後で保持 |
| `dist/vite.svg` | **存在しない** |

続けて既存フローが壊れていないことを確認する。

```bash
pnpm typecheck && pnpm lint:check && pnpm format:check
pnpm test && pnpm test:a11y
pnpm dev            # ★C-3: Storybook が起動し、スタイルが当たること
pnpm build-storybook
```

**確認事項 C-3:** `publicDir: false` が Storybook に影響しないこと。影響する場合は `publicDir` の指定をライブラリビルド時のみに限定する（`defineConfig` を関数形式にして `command`/`mode` で分岐）。

**確認事項 C-5:** `.css.ts` に対する不要な `.d.ts` が大量に出ていないか。無害だが量が多ければ `exclude` に加える。

### コミット 1

```
build: emit type declarations and externalize React
```

---

## フェーズ 2: CSS 3 種類の生成（FR-4）

### 2-1. `src/main.tsx` の import を整理

light-only / dark-only の import を外し、`variables.css` のみにする。

```ts
// 配色を固定した CSS は dist で派生生成するため、ここでは両対応版だけを読む
import './styles/variables.css';
```

**確認事項 C-1:** 外した結果、既定 CSS に必要な変数がすべて残ること。3 ファイルが同じ 312 変数を定義していることは確認済みだが、実出力で検証する。

### 2-2. `scripts/build-css-variants.ts` を新設

責務は 2 つ。

1. Vite が出力した `zukki-design-system.css` を `styles.css` にリネームする
2. そこから `styles-light.css` / `styles-dark.css` を派生生成する

派生生成の要件。

- `light-dark(a, b)` を `a` / `b` へ解決する。**引数に `var()` が入れ子になるため、括弧の対応を数えて分割する**（単純な正規表現では壊れる）
- `color-scheme: light dark` → `color-scheme: light` / `dark` へ置換する。忘れるとフォームコントロールなど UA 描画が既定配色のまま残る
- 変換後に `light-dark(` が 0 件であることを検証し、残っていれば**エラーで落とす**

### 2-3. `build` スクリプトに組み込む

```json
"build": "tsc -b && vite build && tsx scripts/build-css-variants.ts"
```

### 検証ゲート 2

```bash
pnpm build
```

| 確認項目 | 期待値 |
| --- | --- |
| `dist/styles.css` | 存在し `light-dark()` を保持 |
| `dist/styles-light.css` | `light-dark()` が 0 件 |
| `dist/styles-dark.css` | `light-dark()` が 0 件 |
| `--color-focus` の値 | light: `#0e70f1` / dark: `#5b9ef5` |
| **ハッシュ変数の値** | light と dark で異なること（これが効くかどうかの本質） |
| `color-scheme` | 各版で `light` / `dark` に固定されていること |
| 3 版の変数の数 | すべて同数であること（取りこぼしが無い） |

### コミット 2

```
build: ship light-dark, light-only and dark-only stylesheets
```

---

## フェーズ 3: package.json の配布設定（FR-1 / FR-3 / FR-5）★リスク

### 3-1. `exports` / `types` / `files` を追加

設計 D-5 / D-7 のとおり。

- `exports` に `.` と 3 つの CSS、`./package.json`
- `main` / `module` / `types` も保険として併記
- `files: ["dist", "README.md"]`

### 3-2. React を `peerDependencies` へ移す

- `peerDependencies` に `react` / `react-dom` を `^19.0.0` で
- `devDependencies` にも `19.2.8` を残す（開発時に必要）
- `dependencies` は `clsx` のみ

移動後に `pnpm install` を実行し、依存ツリーが壊れていないことを確認する。

### 3-3. `prepare` スクリプトを追加

```json
"prepare": "pnpm build"
```

**確認事項 C-4:** ローカルの `pnpm install` が過度に遅くならないこと。

### 3-4. `"type": "module"` を検討して入れる ★

**このフェーズで最もリスクが高い変更。** 単独で行い、問題があれば切り戻す。

**確認事項 C-2:** 次がすべて壊れないこと。

```bash
pnpm typecheck && pnpm lint:check && pnpm format:check
pnpm test && pnpm test:a11y
pnpm build
pnpm dev            # Storybook
```

`eslint.config.js`（`.js` 拡張子）の解釈が変わる点に特に注意する。**壊れる場合は `type` を入れずに進める。** 既存の警告が残るだけで、配布物の要件には影響しない。

### 検証ゲート 3

```bash
npm pack --dry-run
```

| 確認項目 | 期待値 |
| --- | --- |
| ファイル数 | 315 → 100 ファイル台 |
| `dist/` | 含まれる |
| `.codex/` `.storybook/` `docs/` `.github/` `style-dictionary/` `figma/` `src/` | **含まれない** |

加えて既存コマンドがすべて成功すること。

### コミット 3

```
feat: expose the package entry points for consumers
```

`type: module` を入れた場合はコミットを分ける。

---

## フェーズ 4: install 実地検証（FR-6）★合否を決めるゲート

**本 spec の核心。** 設定を書いただけでは「使える」保証にならない。

### 4-1. tarball を作る

```bash
npm pack --pack-destination <scratchpad>
```

### 4-2. 検証用プロジェクトを作る

リポジトリ外（scratchpad）に最小の React + Vite プロジェクトを用意し、tarball を install する。**リポジトリ内に作らない**（node_modules の巻き込みと、ワークスペース解決による偽陽性を避けるため）。

### 4-3. 検証項目

| # | 確認項目 | 方法 | 失敗したら |
| --- | --- | --- | --- |
| 1 | import が解決できる | `import { Button } from 'zukki-design-system'` | `exports` を見直す |
| 2 | 型が効く | `variant="danger"` で型エラーになること | dts / `types` を見直す |
| 3 | CSS が当たる | `styles.css` を読み、描画色を実測 | CSS の `exports` を見直す |
| 4 | **フックが動く** | `useState` を持つ `Dialog` 等を描画 | React 外部化を見直す |
| 5 | 配色切り替え | 既定 CSS で `color-scheme: dark` を当てて色が変わる | `cssTarget` を見直す |
| 6 | light 固定 | `styles-light.css` でダークにならない | 派生生成を見直す |
| 7 | dark 固定 | `styles-dark.css` でライトにならない | 同上 |

描画結果の検証には導入済みの Playwright（Chromium）を使う。**「エラーが出ない」ではなく「実際の色が変わる」ところまで測る。**

項目 4 が最重要。React の二重読み込みは静的解析では検出できず、実際に描画して初めて `Invalid hook call` として現れる。

### 検証ゲート 4

7 項目すべてが通ること。**1 つでも落ちれば該当フェーズへ戻る。**

結果は `docs/specs/publishable-package/results.md` に実測値付きで記録する。

### コミット 4

検証用の一時プロジェクトはリポジトリに含めない。記録のみコミットする。

```
docs: record the install verification results
```

---

## フェーズ 5: CI（NFR-2）

### 5-1. `.github/workflows/ci.yml` に配布物検証ジョブを追加

既存の `check` マトリクスと `a11y` ジョブは変更しない。独立ジョブとして追加する。

検証内容（設計 D-9）。

1. `pnpm build` が成功する
2. `dist/` に `.d.ts` と 3 種類の CSS が揃っている
3. **バンドルに React 実装が混入していない**（`useSyncExternalStore` が 0 件）
4. 既定 CSS に `light-dark()` が保持されている
5. light / dark 版に `light-dark()` が残っていない
6. `npm pack` に不要なディレクトリが含まれない

3 と 4 は設定を戻すと黙って壊れる箇所なので、必ず機械で見る。

検証スクリプトは `scripts/verify-dist.ts` として切り出し、ローカルでも同じものを実行できるようにする（`pnpm verify:dist`）。

### 検証ゲート 5

- ローカルで `pnpm verify:dist` が成功する
- **意図的に設定を壊した状態で失敗する**ことを確認する（`external` を外す等。確認後は戻す）
- PR 作成後、CI 上でジョブが成功する

### コミット 5

```
ci: verify the built package on pull requests
```

---

## フェーズ 6: ドキュメント（NFR-3）

### 6-1. `README.md` の更新

現状 41 行でディレクトリ構成とトークン生成手順しか無い。次を追加する。

- install 手順（git install の形）
- **CSS の import が必須であること**と 3 種類の使い分け
- 最小のコード例
- **対応ブラウザ**（`light-dark()` に依存するため Chrome 123 / Safari 17.5 / Firefox 120 以降）

利用側 API の詳細な説明は #90 の範囲なので、ここでは「動かすために最低限必要なこと」に絞る。

### 6-2. `AGENTS.md` の更新

配布物に関わる規約を追記する。

- `pnpm build` が型と 3 種類の CSS を生成すること
- 公開 API を変えたら `pnpm verify:dist` を通すこと

### 6-3. `results.md` の仕上げ

- 実測値（サイズの変化、検証結果）
- 設計からの変更点
- 判断を保留した項目

### 検証ゲート 6

```bash
pnpm lint:check && pnpm format:check && pnpm typecheck
pnpm test && pnpm test:a11y
pnpm build && pnpm verify:dist
```

すべて成功すること。

### コミット 6

```
docs: document how to install and use the package
```

---

## ユーザー確認が必要になるポイント

| タイミング | 内容 |
| --- | --- |
| 3-4 | `"type": "module"` で既存設定が壊れた場合の扱い（入れずに進めるか、設定を直すか） |
| 検証ゲート 4 | 実地検証で想定外の失敗が出た場合の方針 |
| 6-1 | 対応ブラウザを README に明記する際の下限バージョン |

## リスクと対応

| リスク | 影響 | 対応 |
| --- | --- | --- |
| `type: module` で既存設定が壊れる | 開発フロー全体 | フェーズ 3 で単独変更し、壊れたら入れない |
| `publicDir: false` で Storybook が壊れる | `pnpm dev` | ゲート 1 で確認。壊れるならビルド時のみ分岐 |
| dts が `.css.ts` の型を大量に出す | 配布物の肥大 | ゲート 1 で確認。多ければ exclude |
| 派生生成が入れ子の `light-dark()` を壊す | 配色が崩れる | 括弧の対応を数える実装 + 変換後の残存チェックで落とす |
| install 検証で React 二重読み込みが再発 | 要件未達 | フェーズ 4 が専用のゲート。静的解析（`useSyncExternalStore` 0 件）と実描画の二重で見る |
| `prepare` が install を遅くする | 開発体験 | C-4 で実測。許容できなければ `prepublishOnly` へ変更を検討 |

## 全体の受け入れ確認

`requirements.md` の受け入れ条件を最終確認する。

- [ ] `npm pack` に `dist/` が含まれ不要物が無い（ゲート 3）
- [ ] 配布物に `.d.ts` が含まれる（ゲート 1）
- [ ] ES / UMD の両方で React が外部化されている（ゲート 1）
- [ ] `react` / `react-dom` が `peerDependencies` かつ範囲指定（フェーズ 3）
- [ ] 既定 CSS に `light-dark()` がネイティブのまま含まれる（ゲート 2）
- [ ] 3 つの CSS が `exports` から import できる（ゲート 3・4）
- [ ] 3 つそれぞれで実際に色が変わる（ゲート 4）
- [ ] 別プロジェクトに install して動作確認した（ゲート 4）
- [ ] 既定 CSS で `color-scheme: dark` により切り替わる（ゲート 4）
- [ ] 既存コマンドがすべて成功する（各ゲート）
- [ ] 配布物の健全性が CI で検証される（ゲート 5）
- [ ] README に install と CSS import の手順がある（6-1）
