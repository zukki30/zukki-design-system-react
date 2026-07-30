# CLAUDE.md

このファイルは、本リポジトリで作業する際の Claude Code（claude.ai/code）向けガイドです。

## コマンド

```bash
# 開発（Storybook をポート 6006 で起動）
pnpm dev

# ビルド（TypeScript コンパイル + Vite バンドル）
pnpm build

# Lint & フォーマット
pnpm lint            # 自動修正あり
pnpm format          # 自動修正あり
pnpm lint:check      # 修正せず検査のみ（CI と同じ）
pnpm format:check    # 修正せず検査のみ（CI と同じ）
pnpm typecheck       # tsc -b のみ（バンドルなし）

# テスト
pnpm test           # 単発実行
pnpm test:watch     # ウォッチモード
pnpm test:coverage  # カバレッジ付き

# デザイントークン（Figma → CSS 変数 → TypeScript）
pnpm token:transform   # Figma エクスポート → JSON
pnpm build:tokens      # JSON → CSS + TypeScript ファイル
```

## アーキテクチャ

TypeScript と Vanilla Extract（CSS-in-JS）で構築した **React コンポーネントライブラリ**（デザインシステム）です。コンポーネントは Storybook 上でドキュメント化・開発します。

**技術スタック:** React 19 / TypeScript 6 / Vite 8 / Vanilla Extract / Vitest 4 / Storybook 10

**パッケージマネージャ:** pnpm（`packageManager` で固定）

**ライブラリのエントリポイント:** `src/main.tsx` で全コンポーネントを export します。Vite は UMD と ES モジュール（`zukki-design-system.umd.js`、`zukki-design-system.es.js`）の両方を出力します。

**デザイントークンのパイプライン:** Figma（tokens.json）→ `pnpm token:transform` → `style-dictionary/tokens/*.json` → `pnpm build:tokens` → `src/design-tokens/*.ts` ＋ `src/styles/theme.css.ts` 内のグローバル CSS 変数。

すべてのコンポーネントスタイルは、`src/styles/theme.css.ts` から export される `vars` オブジェクト経由で CSS 変数を参照します。

## コンポーネント構成

各コンポーネントは `src/components/ComponentName/` 配下に、以下のレイアウトで配置します。

```
ComponentName/
├── hooks/                    # 任意: カスタムフック
│   ├── useComponentName.ts
│   ├── useComponentName.spec.ts
│   └── index.ts
├── ComponentName.tsx         # コンポーネント実装
├── ComponentName.stories.tsx # Storybook ストーリー
├── ComponentName.css.ts      # Vanilla Extract スタイル
└── index.ts                  # バレルエクスポート
```

## コーディング規約

**TypeScript / React:**

- 関数コンポーネントのみ: `export const ComponentName = ({ ...props }: Props) => { ... }`
- 型定義はすべて `interface` ではなく `type` を使用する。`any` は使用しない
- ネイティブな HTML 属性を展開するには `ComponentPropsWithoutRef<'tag'>` を使用する
- 条件付き className の結合には `clsx()` を使用する
- `useEffect` の使用は最小限に抑え、宣言的なパターンを優先する
- 深い `if/else` のネストを避け、条件が複数ある場合は `switch` を使用する

**スタイリング（Vanilla Extract）:**

- スタイルはすべて `ComponentName.css.ts` 内に `@vanilla-extract/css` を用いて記述する
- クラスセレクタは BEM 命名に従う
- すべての値に `src/styles/theme.css.ts` の `vars` を使用する（色・余白などのハードコード禁止）
- コンポーネントのバリアントには `styleVariants()` を使用する

**テスト:**

- export された関数はすべてテストする。`if/else` は両分岐、`switch` は全 case を網羅する
- テストファイル: `*.spec.ts` または `*.test.ts`

**Git コミット:**

- 英語のメッセージで、プレフィックスを付ける: `feat`、`fix`、`chore`、`refactor`、`test`、`docs`、`style`、`ci`、`perf`、`revert`

**パスエイリアス:** `@/*` は `src/*` に解決される

## ブランチ

作業は `main` ブランチから派生したブランチで行ってください。ブランチ名は `feature/xxx`、`fix/xxx`、`chore/xxx` の形式で作成します。
