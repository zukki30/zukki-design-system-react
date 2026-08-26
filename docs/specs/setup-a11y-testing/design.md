# 設計: a11y エラーを検出できる環境の構築

対象要件: [`requirements.md`](./requirements.md)

## 全体構成

2 層で検査する。どちらも終了コードで合否が判定でき、CI でブロックされる。

| 層 | 実行系 | 検出対象 | 対応要件 |
| --- | --- | --- | --- |
| 静的解析 | ESLint（既存の `lint:check`） | JSX 上で判定できる構造的な違反 | FR-1 |
| 実行時 | Vitest browser mode + Chromium 上で全ストーリーに axe-core | `color-contrast` を含むレンダリング依存の違反 | FR-2 |

Storybook のパネル表示（FR-6）は `@storybook/addon-a11y` を入れることで副次的に得られる。実行時検査は同じアドオンの `afterEach` フックを `@storybook/addon-vitest` が駆動する形で行うため、**アドオンは 1 つで開発時の目視と CI 検査の両方を賄う**。

```
                    @storybook/addon-a11y (axe-core 同梱)
                              │
              ┌───────────────┴───────────────┐
              │                               │
     Storybook UI のパネル              afterEach フック
     （人間の目視・FR-6）                      │
                                    @storybook/addon-vitest
                                              │
                                  Vitest browser mode + Chromium
                                       （CI 検査・FR-2）
```

## 追加する依存

| パッケージ | バージョン | 用途 |
| --- | --- | --- |
| `@storybook/addon-a11y` | `10.5.10` | axe-core 同梱。パネル表示と `afterEach` 検査 |
| `@storybook/addon-vitest` | `10.5.10` | ストーリーを Vitest のテストとして実行する |
| `@vitest/browser` | `4.1.11` | browser mode 本体 |
| `@vitest/browser-playwright` | `4.1.11` | Playwright プロバイダ |
| `playwright` | `^1.62.1` | ブラウザバイナリ。`@vitest/browser-playwright` の必須 peer |

すべて devDependencies に追加する。現行の `storybook@10.5.10` / `vitest@4.1.11` は上記の peer 要求と完全一致することを確認済み（NFR-3）。

### バージョン固定に関する注意

`@vitest/browser-playwright@4.1.11` の peer は `vitest: "4.1.11"` と **完全一致指定** である。現在の `package.json` は `"vitest": "^4.1.11"` なので、vitest だけが 4.2 系に上がると peer 解決が壊れる。

対応として、`vitest` / `@vitest/browser` / `@vitest/browser-playwright` の 3 つを Dependabot の同一グループに入れて同時更新させる。既存の `build-test` グループに含める形とする。

## ファイル別の変更

### 1. `eslint.config.js` — jsx-a11y ルールの有効化（FR-1）

**実装上の注意:** このリポジトリは既に `plugins: { 'jsx-a11y': eslintPluginJsxA11y }` を登録済みのため、`...eslintPluginJsxA11y.flatConfigs.recommended` をそのまま展開すると `ConfigError: Key "plugins": Cannot redefine plugin "jsx-a11y"` で落ちる（実測で確認済み）。**`rules` のみを取り出して適用する。**

```js
{
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ['**/*.{ts,tsx}'],
  // ...
  rules: {
    ...reactHooks.configs.recommended.rules,
    // plugins には既に jsx-a11y を登録しているため、
    // flatConfigs.recommended をそのまま展開すると plugin の再定義エラーになる。
    // ルールセットだけを取り込む。
    ...eslintPluginJsxA11y.flatConfigs.recommended.rules,
    'react-refresh/only-export-components': [...],
    // ...
  },
}
```

### 2. `.storybook/main.ts` — アドオンの追加

```ts
addons: [
  '@storybook/addon-onboarding',
  '@chromatic-com/storybook',
  '@storybook/addon-docs',
  '@storybook/addon-a11y',
  '@storybook/addon-vitest',
],
```

### 3. `.storybook/preview.tsx` — a11y パラメータ（FR-2 / FR-6）

```ts
parameters: {
  a11y: {
    // 違反があればストーリーのテストを失敗させる。
    // 'todo' にすると検出はするが失敗させない（段階導入用）
    test: 'error',
    config: {
      rules: [
        // ストーリーは文書全体ではなく単一コンポーネントを隔離して描画するため、
        // 文書構造レベルのルールは常に違反になる。コンポーネント自身の欠陥ではない
        { id: 'region', enabled: false },
        { id: 'page-has-heading-one', enabled: false },
      ],
    },
  },
  // 既存の docs / controls はそのまま
}
```

無効化するルールの選定方針は「決定事項 D-4」を参照。

### 4. `.storybook/style.css` — テスト環境での配色解決（FR-2）

配色は `light-dark()` で定義されており（`src/design-tokens/light-dark.ts` に 219 箇所）、解決には `color-scheme` の宣言が必要である。`:root { color-scheme: light dark; }` は `src/styles/variables.css` にあるが、これは `src/main.tsx` からのみ import されており、**ストーリー実行環境では読み込まれない**。

`:root` の宣言を先頭に追加する。

```css
/* light-dark() の解決に必要。テスト環境では下の 2 クラスが付かないため、
   ブラウザの prefers-color-scheme（Playwright でエミュレート）に従う */
:root {
  color-scheme: light dark;
}

.dark-theme {
  color-scheme: dark;
}

.light-theme {
  color-scheme: light;
}
```

`:root` と `.dark-theme` / `.light-theme` は詳細度が同じ（0,1,0）なので、**`:root` を先に書くことで後続のクラスが優先される**。これにより Storybook UI 側の既存挙動は変わらない。

### 5. `vitest.config.ts`（新規） — プロジェクト分割（FR-2 / FR-4 / NFR-1）

現在 `vite.config.ts` に置いている `test` ブロックをこちらへ移し、3 プロジェクトに分割する。

```ts
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { storybookTest } from '@storybook/addon-vitest/vitest-plugin';
import { playwright } from '@vitest/browser-playwright';
import { defineConfig, configDefaults } from 'vitest/config';

const dirname = path.dirname(fileURLToPath(import.meta.url));

// 配色ごとにプロジェクトを分ける。light-dark() の解決は
// prefers-color-scheme に従うため、Playwright 側でエミュレートする
const storybookProject = (name: string, colorScheme: 'light' | 'dark') => ({
  extends: './vite.config.ts',
  plugins: [storybookTest({ configDir: path.join(dirname, '.storybook') })],
  test: {
    name,
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({ contextOptions: { colorScheme } }),
      instances: [{ browser: 'chromium' }],
    },
  },
});

export default defineConfig({
  test: {
    projects: [
      {
        extends: './vite.config.ts',
        test: {
          name: 'unit',
          globals: true,
          environment: 'jsdom',
          setupFiles: ['./test/setup.ts'],
          css: true,
          exclude: [...configDefaults.exclude, 'e2e/*'],
        },
      },
      storybookProject('a11y-light', 'light'),
      storybookProject('a11y-dark', 'dark'),
    ],
  },
});
```

**セットアップファイルは不要。** Storybook 10.3 以降、`@storybook/addon-vitest` が preview annotations を自動適用する（アドオン内部の判定ロジックで確認済み）。`setProjectAnnotations` を書いた `.storybook/vitest.setup.ts` は作らない。

### 6. `vite.config.ts` — `test` ブロックの削除

`test` を `vitest.config.ts` へ移す。ライブラリビルドと Storybook のビルダ設定（`viteConfigPath: 'vite.config.ts'`）としての役割は維持する。`plugins`（react / vanilla-extract）と `resolve` は各プロジェクトが `extends: './vite.config.ts'` で引き継ぐ。

### 7. `package.json` — スクリプト（FR-4 / NFR-1）

```json
"test": "vitest run --project unit",
"test:watch": "vitest --project unit",
"test:ui": "vitest --ui --project unit",
"test:coverage": "vitest run --project unit --coverage",
"test:a11y": "vitest run --project a11y-light --project a11y-dark"
```

`pnpm test` は従来どおり jsdom の 33 spec のみを実行する（NFR-1）。`pnpm test:a11y` が CI と同一の検査を単一コマンドで実行する（FR-4）。

### 8. `.github/workflows/ci.yml` — CI ジョブ（FR-3 / NFR-2）

既存の `check` マトリクスは変更しない。ブラウザのインストールとキャッシュが必要なため、**独立したジョブ**として追加する。マトリクス内に条件付きステップを足すより構成が明瞭で、ジョブが分かれていれば片方が落ちても他方の結果は見える（既存の `fail-fast: false` の意図を踏襲）。

```yaml
  a11y:
    name: a11y
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: pnpm/action-setup@v6.0.10
      - uses: actions/setup-node@v7
        with:
          node-version: 24.14.1
          cache: pnpm
      - run: pnpm install --frozen-lockfile

      # ブラウザバイナリは重いのでバージョンをキーにキャッシュする
      - name: Resolve playwright version
        id: pw
        run: echo "version=$(pnpm ls playwright --depth 0 --json | node -p "JSON.parse(require('fs').readFileSync(0,'utf8'))[0].devDependencies.playwright.version")" >> "$GITHUB_OUTPUT"
      - uses: actions/cache@v4
        id: pw-cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ steps.pw.outputs.version }}
      - name: Install Chromium
        # Chromium のみ。他ブラウザは入れない（NFR-2）
        run: pnpm exec playwright install --with-deps chromium

      - run: pnpm test:a11y
```

キャッシュヒット時もシステム依存ライブラリのために `install --with-deps` は実行する（バイナリのダウンロードはスキップされる）。

### 9. 既知の静的解析違反の解消（受け入れ条件）

| ファイル | ルール | 対応 |
| --- | --- | --- |
| `src/components/Dialog/Dialog.tsx:191` | `click-events-have-key-events`<br>`no-noninteractive-element-interactions` | 理由コメント付きで局所 disable。ESC はネイティブの `onCancel` が処理しており、キーボード操作は既に成立しているため誤検知 |
| `src/components/Card/Card.stories.tsx:14` | `anchor-is-valid` | ストーリー内の `href="#"`。実在するパス（`href="/"` 等）に差し替える |

Dialog の disable は以下の形とする。

```tsx
{/* パーツ間の配線を利用側の props に潰されないよう、{...props} は先に展開する */}
{/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions --
    オーバーレイクリックで閉じるための onClick。キーボードでの閉じる操作は
    ネイティブ <dialog> の ESC（onCancel）が担っているため、別途キーハンドラは不要 */}
<dialog
```

### 10. `CLAUDE.md` — ドキュメント（NFR-4）

「コマンド」節に `test:a11y` を追記し、「テスト」の規約に a11y 検査の位置づけと違反時の対処方針（`todo` への退避と Issue 起票）を追記する。

## 決定事項

### D-1: テスト設定を `vitest.config.ts` へ分離する

`vite.config.ts` にプロジェクト定義まで載せると、ライブラリビルド設定・Storybook ビルダ設定・テスト設定が 1 ファイルに混在する。Storybook 公式のテンプレートも独立した `vitest.config.ts` を生成する形をとっているため、これに倣う。

### D-2: `pnpm test` の役割は変えない

既存の 33 spec は高速な jsdom 実行のまま残す（NFR-1）。ブラウザ検査は `pnpm test:a11y` に分ける。`vitest run` を素で叩くと全プロジェクトが走るが、これは意図した挙動として許容する。

### D-3: ダークモードの検査方法 — Playwright の配色エミュレーション

**背景:** 現在のテーマ切り替えは `.storybook/preview-head.html` の中で `window.location.href` に `backgrounds.value:!hex(333)` が含まれるかを文字列判定し、`<html>` にクラスを付けるという実装になっている。`preview-head.html` は Storybook の iframe テンプレート機能であり、**Vitest browser mode では適用されない**。したがってこの仕組みのままではダーク配色を検査できない。

検討した 2 案:

| 案 | 内容 | 評価 |
| --- | --- | --- |
| **A（採用）** | `:root { color-scheme: light dark }` を preview に効かせ、Playwright の `contextOptions.colorScheme` で `prefers-color-scheme` をエミュレートする。プロジェクトを配色ごとに 2 つ作る | Storybook UI の既存挙動に一切触れずダーク検査が成立する。変更は CSS 1 行と config のみ |
| B | `preview-head.html` の URL 判定を Storybook の `globalTypes` + decorator に置き換え、`storybookTest({ initialGlobals: { theme: 'dark' } })` でプロジェクトを分ける | Storybook 公式が想定する形であり URL 判定の脆さも解消するが、既存のツールバー連携（backgrounds との連動）の挙動が変わる。本 spec のスコープを超える |

**A を採用する。** URL 判定の置き換えは独立した改善であり、別 Issue として起票する。

#### 【2026-08-26 追記】実測により案 A は不成立と判明

フェーズ 3 の検証（一時ストーリーで実測）の結果、**C-3 の前提が覆った**。

| 項目 | `a11y-light` | `a11y-dark` |
| --- | --- | --- |
| `document.documentElement.className` | `light-theme` | `light-theme` |
| `getComputedStyle(:root).colorScheme` | `light` | `light` |
| `light-dark(rgb(1,2,3), rgb(4,5,6))` の解決 | `rgb(1, 2, 3)` | `rgb(1, 2, 3)` |
| `Button` variant=primary の背景 | `rgb(14, 112, 241)` | `rgb(14, 112, 241)` |

`preview-head.html` は **Vitest browser mode でも適用される**。テスト実行時の URL には globals が含まれないため、スクリプトは常に `light-theme` を付与する。これが `color-scheme: light` を強制し、Playwright の `contextOptions.colorScheme` によるエミュレーションを打ち消してしまう。両プロジェクトの計測値が完全に一致しており、案 A ではダーク配色を検査できない。

**したがって案 B（`globalTypes` + decorator）へ切り替える。** 詳細は D-8 に記す。

### D-4: ストーリー起因のノイズは最小限の無効化にとどめる

無効化するのは、単一コンポーネントを隔離描画するという**ストーリーの性質上、常に違反となるルール**に限る。

- `region` — ページ全体がランドマークに収まっているかを見るルール。単一コンポーネントの描画には適用できない
- `page-has-heading-one` — 文書に `h1` があるかを見るルール。同上。加えて本デザインシステムの `HeadingLevel` は `h1` を意図的に含まない

一方 `heading-order` は**無効化しない**。`Card.Title` / `Dialog.Title` の `level` prop はまさにこのルールが対象とする領域であり、無効化するとコンポーネント自身の欠陥を見逃す（要件の条件に反する）。既存ストーリーは 1 ストーリー内に複数バリアントを並べ `<h4>` で区切る構成（例: `Button.stories.tsx`）のため違反が出る可能性が高いが、その場合は**ルールではなくストーリー側の見出しを修正する**。

無効化するルールが上記 2 つで足りるかは実測で確定させる（下記「実装時の確認事項」C-2）。追加する場合は同じ基準（コンポーネントの欠陥を見逃さないか）で判断し、理由をコメントに残す。

### D-5: 既存違反は計測してから切り分ける

実ブラウザ検査を有効化した時点で `color-contrast` を中心に既存の違反が出る可能性がある。要件の方針に従い、

1. まず `parameters.a11y.test: 'todo'` の状態で全件を洗い出す
2. 軽微かつ明確なものは本対応で修正する
3. デザイン判断を伴うものは当該ストーリー単位で `parameters: { a11y: { test: 'todo' } }` を指定して非ブロック化し、別 Issue で追跡する
4. 最終的に preview の既定値は `test: 'error'` にする

ストーリー単位の `todo` 指定は、グローバルに `todo` を残すのと違い**残っている箇所がコード上で見える**ため、追跡漏れを防げる。

### D-6: CI は独立ジョブにする

既存マトリクスは `pnpm ${{ matrix.task }}` を一律に実行する構成で、ブラウザのインストールとキャッシュを足すと `if: matrix.task == 'test:a11y'` の条件付きステップが 3 つ増えて見通しが悪くなる。独立ジョブなら既存マトリクスに手を入れずに済む。

## 実装時の確認事項

設計上の想定のうち、実際に動かして確かめる必要があるもの。

- **C-1:** `extends: './vite.config.ts'` で vanilla-extract / react プラグインが各プロジェクトへ正しく引き継がれること。引き継がれない場合は各プロジェクトで `plugins` を明示する
- **C-2:** `parameters.a11y.config.rules` の無効化が `region` / `page-has-heading-one` の 2 つで足りるか。全ストーリー実行の結果で確定させる
- **C-3:** `.storybook/preview-head.html` が Vitest browser mode で適用されないという想定（D-3 の前提）。もし適用される場合、URL 判定が常に `light-theme` を付けてしまい `colorScheme` エミュレーションが効かなくなるため、その場合は案 B へ切り替える
- **C-4:** `color-contrast` が実際に評価されていること。ダーク側で意図的にコントラスト不足の状態を作り、検出されることを確認する（受け入れ条件）
- **C-5:** `pnpm test` が従来どおり 33 spec を実行し全て成功すること（NFR-1）

## 受け入れ条件との対応

| 受け入れ条件 | 対応箇所 |
| --- | --- |
| `pnpm lint:check` が jsx-a11y 違反を検出する | 変更 1 |
| 実ブラウザ axe 検査が単一コマンドで実行できる | 変更 5・7（`pnpm test:a11y`） |
| `color-contrast` が評価されていることを確認できる | 変更 4・5、確認事項 C-4 |
| 既存 `pnpm test` が従来どおり成功する | 変更 6・7、確認事項 C-5 |
| CI で 2 種類の検査が走りブロックされる | 変更 8（既存 `check` + 新規 `a11y`） |
| 既知の 3 件が解消または理由付きで抑制されている | 変更 9 |
| `todo` の一覧と追跡先が記録されている | D-5 |
| `CLAUDE.md` に実行方法と対処方針が記載されている | 変更 10 |
