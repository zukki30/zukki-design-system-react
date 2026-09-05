# 設計: install して使える配布物にする

対象要件: [`requirements.md`](./requirements.md)

## 検証済みであること

設計の前提はすべて実地で確認した。プローブ用の設定でビルドし、成果物を検査した結果である。

| 検証項目 | 結果 |
| --- | --- |
| `vite-plugin-dts` が Vite 8 で動くか | ✅ 100 個の `.d.ts` を生成。1.3 秒 |
| `@/` エイリアスが解決されるか | ✅ `@/types` → `../../types` に書き換わる |
| 日本語 JSDoc が `.d.ts` に残るか | ✅ 残る |
| React の外部化 | ✅ ES は `import … from "react"`、UMD は `require("react")` |
| `cssTarget` で `light-dark()` が保持されるか | ✅ 348 箇所そのまま出力 |
| `light-dark()` を解決した派生 CSS が作れるか | ✅ ハッシュ変数まで正しく解決される |

改善の見込み。

| | 現状 | 改善後 |
| --- | --- | --- |
| ES バンドル | 75.27 kB | **31.41 kB** |
| UMD バンドル | 58.17 kB | **24.83 kB** |
| CSS | 79.21 kB | **56.19 kB** |
| `.d.ts` | 0 件 | **100 件** |

## 全体構成

```
pnpm build
  ├─ vite build                       … JS バンドル（React を外部化）
  │    └─ vite-plugin-dts             … .d.ts を生成（エイリアス解決込み）
  │    └─ cssTarget 指定              … light-dark() をネイティブのまま出力
  └─ scripts/build-css-variants.ts    … 既定 CSS から light / dark 版を派生生成
```

配布物の形。

```
dist/
├── zukki-design-system.es.js
├── zukki-design-system.umd.js
├── main.d.ts + components/**/*.d.ts   （100 ファイル）
├── styles.css        … 既定。light-dark() を保持
├── styles-light.css  … ライト固定（派生）
└── styles-dark.css   … ダーク固定（派生）
```

## 決定事項

### D-1: dts 生成は `vite-plugin-dts` を使う

素の `tsc --emitDeclarationOnly` は使えない。`src` の 32 ファイルが `@/` エイリアスを使っており、**tsc は出力する `.d.ts` の中でエイリアスを書き換えない**ため、利用側が解決できない `import { HeadingLevel } from '@/types'` が残る。`HeadingLevel` は `Card.Title` の `level` prop の型で公開 API に含まれるため、これは実害がある。

`vite-plugin-dts@5.1.0` はエイリアスを相対パスへ解決することを実測で確認した。peer に `rollup >= 3` を要求するが、Vite 8（rolldown）環境で問題なく動作した。

**バンドルはしない**（`rollup-plugin-dts` / api-extractor による単一ファイル化を行わない）。ファイル構成を保つほうが利用側でのエラー箇所の特定が容易で、追加依存も不要なため。

### D-2: `private: true` は外さない。git install 前提とする

npm レジストリへの publish は運用判断であり、要件のスコープ外（requirements の「スコープ外」）。ただし `private: true` のままでも **git install（`pnpm add github:zukki30/zukki-design-system-react`）は可能**であり、この経路で使えるようにする。

`dist/` は `.gitignore` 済みでリポジトリに含めないため、install 時にビルドが走る必要がある。`prepare` スクリプトを使う。

```json
"prepare": "pnpm build"
```

`prepare` は `npm install`（依存としての install 時）と `npm pack` の両方で自動実行される。将来 publish する運用に切り替える場合も、`private` を外すだけで済む。

なお `prepare` はローカルの `pnpm install` でも走るため、開発時にもビルドが 1 回走る。数秒で終わるため許容する。

### D-3: 3 種類の CSS は「派生生成」で作る

要件の論点 2 について、**派生生成**を採る。

**背景（要件 B の再掲）:** コンポーネントが参照しているのは `createGlobalTheme` が生成するハッシュ変数（`--_1yvh1mm0` 等、542 箇所）で、その定義には値が直接埋め込まれている。意味的な変数（`--color-focus`）は 1 度も参照されていない。そのため既存の `variables-light-only.css` を読ませても見た目は変わらない。

派生生成なら、**ハッシュ変数の定義そのものを書き換える**ため確実に効く。実測で確認した。

```
light 版: --color-focus:#0e70f1  /  --_1yvh1mm0:#0e70f1
dark 版 : --color-focus:#5b9ef5  /  --_1yvh1mm0:#5b9ef5
```

他案を採らない理由。

| 案 | 不採用の理由 |
| --- | --- |
| 参照化（`createGlobalTheme` が `var(--color-focus)` を参照する） | トークンのパイプラインと `theme.css.ts` に手が入り、#84（CSS Modules 移行）と作業が重複する。本 spec の目的は配布物として成立させることであり、内部構造の作り替えは切り離したい |
| 複数ビルド | ビルドが 3 倍になるうえ、3 つの成果物が同期している保証を別途作る必要がある |

派生生成は **1 回のビルド結果から機械的に導出する**ため、3 つの内容が食い違わない（要件 FR-4 の最後の項目）。

#### 変換スクリプトの要点

`scripts/build-css-variants.ts` を新設する。

- `light-dark(a, b)` を `a` / `b` へ解決する。**引数に `var()` などの関数が入れ子になるため、単純な正規表現ではなく括弧の対応を数えて分割する**
- `color-scheme: light dark` を `color-scheme: light` / `dark` へ置き換える。これを忘れるとフォームコントロールなど UA 描画の配色が既定のまま残る
- 変換後に `light-dark(` が 0 件であることを検証し、残っていればエラーで落とす

### D-4: `cssTarget` を指定して `light-dark()` を保持する

Vite の既定では lightningcss が `light-dark()` を `var(--lightningcss-light,…)var(--lightningcss-dark,…)` へ変換する。このポリフィルは `prefers-color-scheme` にしか反応せず、**要素の `color-scheme` プロパティでは切り替わらない**（要件 A）。

`build.cssTarget` を `light-dark()` に対応したブラウザに設定して変換を抑止する。

```ts
build: {
  // light-dark() をポリフィルへ変換させない。
  // ポリフィルは prefers-color-scheme にしか反応せず、
  // 要素単位の color-scheme による切り替えができなくなる
  cssTarget: 'chrome123',
}
```

`light-dark()` のサポート状況は Chrome 123 / Safari 17.5 / Firefox 120 以降。ライブラリの対応ブラウザを事実上ここに定めることになるため、README に明記する。

### D-5: `exports` の構成

```json
{
  "type": "module",
  "main": "./dist/zukki-design-system.umd.js",
  "module": "./dist/zukki-design-system.es.js",
  "types": "./dist/main.d.ts",
  "exports": {
    ".": {
      "types": "./dist/main.d.ts",
      "import": "./dist/zukki-design-system.es.js",
      "require": "./dist/zukki-design-system.umd.js"
    },
    "./styles.css": "./dist/styles.css",
    "./styles-light.css": "./dist/styles-light.css",
    "./styles-dark.css": "./dist/styles-dark.css",
    "./package.json": "./package.json"
  }
}
```

- `main` / `module` / `types` は `exports` に対応しない古いツール向けの保険として併記する
- `./package.json` を公開するのは、ツールがバージョン解決のために読むことがあるため
- CSS は拡張子込みのパスにする。`./styles` だと利用側で拡張子の有無が曖昧になる

**`"type": "module"` の追加に注意。** 現在 `package.json` に `type` が無く、`vite.config.ts` 等が CommonJS として読まれて毎回警告が出ている。`type: "module"` を足すとこの警告は消えるが、リポジトリ内の `.js` ファイルの解釈が変わる。影響範囲を確認したうえで入れる（実装時の確認事項 C-2）。

### D-6: React を外部化し `peerDependencies` へ移す

```ts
build: {
  rollupOptions: {
    external: ['react', 'react-dom', 'react/jsx-runtime'],
    output: {
      globals: {
        react: 'React',
        'react-dom': 'ReactDOM',
        // jsx-runtime を書かないと MISSING_GLOBAL_NAME の警告が出る
        'react/jsx-runtime': 'jsxRuntime',
      },
    },
  },
}
```

`package.json` の依存を組み替える。

```json
"peerDependencies": {
  "react": "^19.0.0",
  "react-dom": "^19.0.0"
},
"devDependencies": {
  "react": "19.2.8",
  "react-dom": "19.2.8"
},
"dependencies": {
  "clsx": "^2.1.1"
}
```

- `react` / `react-dom` は開発時にも必要なので devDependencies に残す
- `clsx` は実行時に必要な真の依存なので `dependencies` に残す
- 範囲は `^19.0.0` とする。現状の完全固定（`19.2.8`）では利用側の React と必ず衝突する

### D-7: 配布物を絞る

`files` フィールドで許可制にする。`.npmignore` による除外制ではなく、**入れるものを明示する**ほうが取りこぼしが起きない。

```json
"files": ["dist", "README.md"]
```

これで `.codex/`（101 ファイル）、`.storybook/`、`docs/`、`.github/`、`style-dictionary/`、`figma/`、`src/` が配布物から外れ、315 ファイル → 100 ファイル台になる。

**`src/` は含めない。** sourcemap 経由のデバッグは魅力だが、TypeScript のソースをそのまま配ると利用側のビルド設定によっては誤って解決されうる。必要になった時点で sourcemap の同梱を別途検討する。

**`public/vite.svg` の混入も止める。** ライブラリビルドでは publicDir が不要なため無効化する。

```ts
build: { ... },
// ライブラリの成果物に public/ の中身を混ぜない
publicDir: false,
```

ただし Storybook は `vite.config.ts` をビルダ設定として参照する。`publicDir: false` が Storybook の静的配信に影響しないことを確認する（実装時の確認事項 C-3）。

### D-8: CSS の出力ファイル名を `styles.css` にする

現在 Vite は `build.lib.name` から `zukki-design-system.css` という名前で出力する。`exports` のキー（`./styles.css`）と実ファイル名を揃えるため、`styles.css` にリネームする。

Vite の lib モードは CSS のファイル名を直接指定できないため、`build-css-variants` スクリプトの中で既定 CSS のリネームも行う。1 つのスクリプトが CSS 成果物の最終形を作る形にまとめ、責務を分散させない。

### D-9: CI で配布物を検証する

設定は一度直せば終わるが、**壊れたことに気づけない状態は避ける**（NFR-2）。`.github/workflows/ci.yml` に独立ジョブを追加する。

検証内容は「install して使える」ことの核心に絞る。

1. `pnpm build` が成功する
2. `dist/` に `.d.ts` / 3 種類の CSS が揃っている
3. **バンドルに React の実装が混入していない**（`useSyncExternalStore` が 0 件であることを確認）
4. 既定 CSS に `light-dark()` が保持されている
5. light / dark 版に `light-dark()` が残っていない
6. `npm pack` の中身に不要なディレクトリが含まれない

3 と 4 は、設定を戻してしまったときに黙って壊れる箇所なので機械で見る。

### D-10: install の実地検証（FR-6）

**要件の核心。** 設定を書いただけでは「使える」保証にならない。

`npm pack` で作った tarball を、リポジトリ外の一時プロジェクトに install して確認する。

| 確認項目 | 方法 |
| --- | --- |
| import が解決できる | `import { Button } from 'zukki-design-system'` |
| 型が効く | 存在しない prop（`variant="danger"`）で型エラーになること |
| CSS が当たる | `styles.css` を読み込み、実際の描画色を測る |
| **フックが動く** | `useState` を持つコンポーネント（`Dialog` 等）を描画し、React 二重読み込みが起きないこと |
| 配色切り替え | 既定 CSS で `color-scheme: dark` を当てて色が変わること |
| light / dark 固定 | 各 CSS で色が固定されること |

描画結果の検証には、既に導入済みの Playwright（Chromium）を使う。

**この検証は本 spec の中で 1 度実行し、結果を記録する。** CI へ常設するかは D-9 の範囲を超えるため、まず手動検証で要件を満たし、常設は結果を見て判断する。

## 変更するファイル

| ファイル | 変更 |
| --- | --- |
| `package.json` | `exports` / `types` / `files` / `peerDependencies` / `prepare` / `type` |
| `vite.config.ts` | `external` / `globals` / `cssTarget` / `publicDir: false` / dts プラグイン |
| `tsconfig.build.json`（新規） | 型出力専用。`noEmit` を外し spec / stories を除外 |
| `scripts/build-css-variants.ts`（新規） | 既定 CSS のリネームと light / dark 版の派生生成 |
| `src/main.tsx` | light-only / dark-only の import を外す（派生生成に置き換わるため） |
| `.github/workflows/ci.yml` | 配布物検証ジョブ |
| `README.md` | install / CSS import / 対応ブラウザ |

## 実装時の確認事項

動かして確かめる必要があるもの。

- **C-1:** `src/main.tsx` から light-only / dark-only の import を外しても、既定 CSS に必要な変数がすべて含まれること。3 ファイルは同じ 312 変数を定義していると確認済みだが、実際の出力で検証する
- **C-2:** `"type": "module"` を追加したときの影響。`vite.config.ts` / `vitest.config.ts` / `eslint.config.js` / `.storybook/*` が壊れないこと。壊れる場合は `type` を入れず、警告は残したまま進める
- **C-3:** `publicDir: false` が Storybook に影響しないこと。`pnpm dev` と `pnpm build-storybook` で確認する
- **C-4:** `prepare` スクリプトがローカルの `pnpm install` を過度に遅くしないこと
- **C-5:** dts 生成が `.css.ts`（vanilla-extract）に対して不要な型を出さないか。出る場合も配布物として無害だが、量が多ければ除外する

## 受け入れ条件との対応

| 受け入れ条件 | 対応 |
| --- | --- |
| `npm pack` に `dist/` が含まれ不要物が無い | D-7 |
| `.d.ts` が含まれる | D-1 |
| React が外部化されている | D-6 |
| `peerDependencies` が範囲指定 | D-6 |
| 既定 CSS に `light-dark()` が残る | D-4 |
| 3 つの CSS が `exports` から import できる | D-3 / D-5 |
| 3 つそれぞれで色が変わる | D-3 / D-10 |
| install して実際に動作する | D-10 |
| 既存コマンドがすべて成功する | 実装時に毎フェーズ検証 |
| CI で配布物が検証される | D-9 |
| README に手順がある | 変更ファイル一覧 |
