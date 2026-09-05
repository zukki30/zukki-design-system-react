# 実施結果

対象 Issue: [#89](https://github.com/zukki30/zukki-design-system-react/issues/89)

## 成果

| | 対応前 | 対応後 |
| --- | --- | --- |
| ES バンドル | 75.27 kB | **31.41 kB** |
| UMD バンドル | 58.17 kB | **24.83 kB** |
| CSS | 79.21 kB | **56.19 kB** |
| `.d.ts` | 0 件 | **100 件** |
| 配布ファイル数 | 315（`dist` は 0 件） | **106**（すべて `dist` と README） |
| tarball | — | 73 kB |

## install 実地検証（FR-6）

リポジトリ外に React + Vite の最小プロジェクトを作り、`npm pack` した tarball を install して確認した。

### 検証結果

| # | 確認項目 | 結果 |
| --- | --- | --- |
| 1 | import が解決できる | ✅ 利用側の `vite build` と `tsc --noEmit` が通る |
| 2 | 型が効く | ✅ `variant="danger"` を型エラーとして検出 |
| 3 | CSS が当たる | ✅ 実際の描画色を計測して確認 |
| 4 | **フックが動く** | ✅ `Dialog` の開閉が動作。エラー 0 件 |
| 5 | `color-scheme` で切り替わる | ✅ 下表 `forced-dark` |
| 6 | light 固定 | ✅ 下表 `light` |
| 7 | dark 固定 | ✅ 下表 `dark` |

### 描画の実測値

`Card` の背景（`surface.raised` = `light-dark(#ffffff, #202226)`）を計測した。OS の設定はライト固定（Playwright の `colorScheme: 'light'`）。

| エントリ | 読み込んだ CSS | `color-scheme` | `--color-surface-raised` | Card 背景 |
| --- | --- | --- | --- | --- |
| default | `styles.css` | `light dark` | `light-dark(#fff,#202226)` | `rgb(255,255,255)` |
| light | `styles-light.css` | `light` | `#fff` | `rgb(255,255,255)` |
| dark | `styles-dark.css` | `dark` | `#202226` | **`rgb(32,34,38)`** |
| forced-dark | `styles.css` + 要素に `color-scheme: dark` | `dark` | `light-dark(#fff,#202226)` | **`rgb(32,34,38)`** |

`dark` と `forced-dark` で実際に背景が変わっており、3 種類の CSS と `color-scheme` による切り替えの両方が機能している。

### 検証中に見つけたこと

#### 利用側のビルドが `light-dark()` を変換してしまう

**配布 CSS がネイティブの `light-dark()` を保っていても、利用側のビルド設定によっては変換される。**

検証プロジェクトを既定設定でビルドしたところ、lightningcss が次の形に変換していた。

```css
--color-surface-raised: var(--lightningcss-light,#fff)var(--lightningcss-dark,#202226)
```

このポリフィルは `prefers-color-scheme` にしか反応しないため、要素に `color-scheme: dark` を指定しても切り替わらない（実際に `forced-dark` が失敗した）。利用側の `build.cssTarget` を `light-dark()` 対応ブラウザに設定したところ、348 箇所が保持され切り替わるようになった。

**これは配布側では解決できない。** 要素単位の配色切り替えを使いたい利用者は、自分のビルド設定で `light-dark()` を残す必要がある。README に明記した。

なお、この制約を受けるのは `styles.css`（既定）だけである。`styles-light.css` / `styles-dark.css` は値が解決済みなので、利用側のビルド設定に左右されない。

#### `color-scheme` の上書きは読み込み順に注意がいる

検証中、`<style>:root{color-scheme:dark}</style>` を `<head>` に置いても効かなかった。ライブラリ CSS の `:root { color-scheme: light dark }` が後から読まれ、同じ詳細度で後勝ちするため。

利用側は次のいずれかにする必要がある。

- ライブラリ CSS より後に読み込む
- インラインスタイル（`<html style="color-scheme: dark">`）を使う
- より高い詳細度のセレクタを使う

これも README に記載した。

## 設計からの変更点

### `declarationMap` を出さないことにした

設計では `declarationMap: true` としていたが、生成された `.d.ts.map` は `../../../src/...` を参照する。`src/` は配布物に含めない方針（D-7）なので、**全てリンク切れの map になる**ことが分かった。無効化した。

これにより配布ファイル数が 205 → 106 に減った。

### UMD をやめて CJS（`.cjs`）にした

レビューでの指摘を受けて検証したところ、**`require()` が中身を取り出せていなかった**。

```
require('zukki-design-system') → export 数 0
```

例外は投げないため気づきにくい。原因は `type: module` 配下の `.js` が ESM として解釈されることで、UMD の `module` / `exports` を見る分岐が通らず、グローバルへ代入する経路に落ちていた。

そもそも UMD の利点である「`<script>` タグでのグローバル読み込み」は、React 本体と `react/jsx-runtime` をグローバルとして用意する必要があり、このライブラリでは現実的でない。CJS へ置き換えた。

```
require('zukki-design-system') → export 数 25 / Button は関数
import { Button } from 'zukki-design-system' → function
```

### `cssTarget` を対応ブラウザの下限に揃えた

当初 `'chrome123'` のみを指定していたが、これでは lightningcss の最適化が Chrome 基準になり、README に記載した Safari / Firefox の下限で動かない構文が出力されうる。3 つとも並べる形にした。

```ts
cssTarget: ['chrome123', 'safari17.5', 'firefox120'],
```

`light-dark()` は 348 箇所とも保持されたままであることを確認済み。

### `"type": "module"` は採用した

設計では「壊れる場合は入れない」としていたリスク項目だが、実測で次がすべて成功した。

```
typecheck / lint:check / format:check / build / test / test:a11y / build-storybook / storybook dev
```

副次的に、既存の CommonJS 警告（`configLoader: 'native'` に関する警告）が build / test の両方で 0 件になった。

## 検証記録

| 確認事項 | 結果 |
| --- | --- |
| C-1: import を減らして変数が欠けないか | ✅ `variables.css` の 312 変数がすべて dist に存在 |
| C-2: `"type": "module"` の影響 | ✅ 全コマンド成功。既存警告も解消 |
| C-3: `publicDir: false` の Storybook への影響 | ✅ `pnpm dev` / `build-storybook` とも正常 |
| C-4: `prepare` による install の遅延 | ✅ `pnpm install` 全体で 7.1 秒 |
| C-5: `.css.ts` に対する不要な `.d.ts` | 20 件生成されるが小さく無害。除外しない |

## 補足

### 検証対象の選定について

当初 `Button` の `variant="primary"` の背景色で配色切り替えを検証しようとしたが、このトークンは `light-dark(#3587f3, #3587f3)` で**ライトとダークで同じ値**だった。差が出ないのは当然で、検証対象として不適切だった。

`light` と `dark` で値が異なるトークンは 65 件ある。そのうち `surface.raised`（`#ffffff` / `#202226`）を使う `Card` に切り替えて計測した。

### `pnpm test:coverage` は引き続き動作しない

`@vitest/coverage-v8` が devDependencies に無いため。本対応の前から壊れており、配布物とは無関係なので触っていない。
