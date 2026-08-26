# 実施結果

対象 Issue: [#83](https://github.com/zukki30/zukki-design-system-react/issues/83)

## 構築したもの

| 層 | コマンド | 内容 |
| --- | --- | --- |
| 静的解析 | `pnpm lint:check` | `eslint-plugin-jsx-a11y` の推奨ルール |
| 実行時 | `pnpm test:a11y` | 全 19 ストーリーファイル（103 ストーリー）を Chromium で描画し `axe-core` にかける。ライト / ダークの 2 配色 = 206 テスト |

CI では既存の `check` マトリクス（`lint:check` を含む）と、新規の独立ジョブ `a11y` が Pull Request 時に実行される。

## 設計からの変更点

### 案 A → 案 B（テーマ切り替え）

設計時は「`preview-head.html` は Vitest browser mode では適用されない」と想定し、Playwright の `contextOptions.colorScheme` でエミュレートする案 A を採用していた（C-3）。

**実測の結果この前提は誤りだった。** `preview-head.html` はテスト実行時にも適用され、URL に globals が含まれないため常に `light-theme` クラスを付与し、`color-scheme: light` を強制していた。ライト / ダーク両プロジェクトの計測値が完全に一致していた。

このため案 B（`globalTypes` + decorator + `initialGlobals`）へ切り替えた。副次的に、URL 文字列判定という脆い実装が解消されたため、**設計 D-3 で別 Issue とする予定だった「URL 判定の置き換え」は本対応に含まれた形になり、別 Issue は不要になった。**

### ルールの無効化は不要だった

設計 D-4 では、ストーリーが単一コンポーネントを隔離描画することによる `region` / `page-has-heading-one` の違反を想定し、無効化を予定していた。

**実測ではこれらは 1 件も検出されなかった。** 懸念していた `heading-order`（`Button.stories.tsx` などの `<h4>` 区切り）も 0 件。したがって `parameters.a11y.config.rules` によるグローバルな無効化は入れていない。

### 要件の誤りを 1 件訂正

要件ファイルに「既に `play` を持つ 15 ファイル」と記載していたが、`grep "play:"` が `display:` に誤マッチしたもので、**`play` 関数は 1 つも存在しなかった**。

この結果 `Dialog` は閉じた状態のストーリーしかなく、ダイアログ本体が一度も検査されない状態だった。`open` を真で始める `Opened` ストーリーを追加して対処した（要件 D-7）。

## 修正した違反

| ルール | 件数 | 原因 | 対応 |
| --- | --- | --- | --- |
| `select-name` | 8 | `Select` のストーリーが裸の `<select>` を描画しており、アクセシブルな名前が無かった | meta の `args` に `aria-label` を追加 |
| `landmark-unique` | 2 | `Breadcrumb` の `AllVariants` が 4 つの `nav` を並べ、既定の `aria-label`（`パンくずリスト`）が重複していた | ストーリー側で variant ごとに名前を振り分け |

## 繰り延べた違反

### `color-contrast` — 141 ノード / 9 コンポーネント / 25 ストーリー

**追跡先: [#86](https://github.com/zukki30/zukki-design-system-react/issues/86)**

いずれも要素自身の背景色に対する実測値であり、検査環境の不備ではなく配色トークン自体が WCAG AA を満たしていないことによる。修正はブランドカラーの変更というデザイン判断を伴い、かつ `src/design-tokens/light-dark.ts` は `figma/tokens.json` からの自動生成物であるため、本 spec のスコープ外とした。

対象コンポーネントと、コントラスト比が最も低い組み合わせ:

| コンポーネント | 組み合わせ数 | 最悪値 |
| --- | --- | --- |
| Button | 17 | `#f0f1f2` on `#72db99` = 1.5:1 |
| Tag | 8 | `#f45a5a` on `#fee2e2` = 2.66:1 |
| Breadcrumb | 6 | `#72db99` on `#ffffff` = 1.7:1 |
| FormField | 4 | `#f78181` on `#ffffff` = 2.49:1 |
| Dialog | 2 | `#f0f1f2` on `#5b9ef5` = 2.42:1 |
| Select | 2 | `#a6aab3` on `#ffffff` = 2.32:1 |
| Card | 1 | `#15171a` on `#000000` = 1.16:1 |
| InputNumber | 1 | `#f45a5a` on `#fee2e2` = 2.66:1 |
| Tooltip | 1 | `#f0f1f2` on `#e1e3e6` = 1.13:1 |

繰り延べ方法は、各 meta で **`color-contrast` ルールのみを無効化**する形とした。`parameters.a11y.test: 'todo'` はそのコンポーネントの全ルールを非ブロックにしてしまうため使っていない。**他のルールは `error` のまま効き続けるため、コントラスト以外の新規違反はこれまでどおりブロックされる。**

トークンを修正したコンポーネントから、この指定を順次外していく。

### `Steps` — ホバー時のラベル色（CI でのみ検出）

**追跡先: [#86](https://github.com/zukki30/zukki-design-system-react/issues/86)**

`StepsItem.css.ts` の `${stepsItem}:is(button):hover` で指定しているラベル色 `vars.color.blue[400]` = `#3587f3` が、白背景に対して **3.55:1** しかない。ホバーしていない状態の `#0e70f1` は約 4.66:1 で AA を満たすため、**ホバー時だけ基準を下回る**。

#### ローカルでは再現せず CI でのみ失敗した

この違反はローカル実行では検出されず、CI で初めて失敗した。原因はホバー状態の有無である。

ヘッドレス Chromium はポインタ位置の初期値が左上にあり、ストーリーのレイアウト次第でその位置に `Steps` のボタンが重なると `:hover` が適用される。ローカル（macOS）と CI（Linux）ではレンダリング結果がわずかに異なるため、CI 側だけがホバー状態になった。

**この性質上、ホバー状態に依存する違反は環境によって検出されたりされなかったりする。** ローカルで `pnpm test:a11y` が通っても CI で落ちる可能性があり、逆もありうる。ホバー時のスタイルを持つコンポーネントを追加・変更したときは、この点に留意する。

根本的に安定させるにはポインタ位置を制御する必要があるが、Vitest browser mode の設定からは直接指定できないため、現時点では未対応とした。

### 関連: ページ背景トークンの不在

このデザインシステムには入力欄などコンポーネント単位の背景トークンはあるが、ページ全体の背景を表すトークンが無い。そのためダーク配色時のコントラストはブラウザ既定の `#000000` に対して計算されている。`Card` の検出（`#15171a` on `#000000`）はこれに起因する可能性がある。#86 で併せて検討する。

## 検証記録

| 確認事項 | 結果 |
| --- | --- |
| C-1: `extends: './vite.config.ts'` でプラグインが引き継がれる | ✅ ストーリーが正常に描画された |
| C-2: 無効化すべきルールの特定 | ✅ 不要と判明（`region` / `page-has-heading-one` / `heading-order` は 0 件） |
| C-3: `preview-head.html` がテスト環境で適用されない | ❌ **覆った**。案 B へ切り替え |
| C-4: `color-contrast` が実際に評価されている | ✅ 意図的な不足を作り、ライト `#eeeeee` on `#ffffff` = 1.16、ダーク `#111111` on `#000000` = 1.11 として両配色で検出 |
| C-5: 既存の `pnpm test` が従来どおり成功 | ✅ 33 ファイル / 436 テスト成功 |

## 本対応の範囲外で見つかった既存の問題

- **`pnpm test:coverage` が動作しない。** `@vitest/coverage-v8` が devDependencies に無いため `MISSING DEPENDENCY` で失敗する。本対応より前から壊れており、a11y とは無関係なため触っていない
