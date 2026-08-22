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

compound components の場合は、context の定義を `ComponentNameContext.ts` としてトップレベルに置きます。context は「共有する値の宣言」であってフックではないため、`hooks/` には入れません（`hooks/` に置くのはロジックのフックだけ）。

```
ComponentName/
├── hooks/                        # 任意: ロジックのフック
│   ├── useComponentNameControl.ts
│   ├── useComponentNameControl.spec.tsx
│   └── index.ts
├── ComponentName.tsx             # ルートとパーツ
├── ComponentNameContext.ts       # context の定義と取得フック
├── ComponentNameContext.spec.tsx # context のテスト
├── ComponentName.stories.tsx
├── ComponentName.css.ts
└── index.ts
```

パーツはルートと同じ `ComponentName.tsx` に置きます。ただし専用の `.css.ts` を持つパーツは、スタイルとセットで独立させたほうが見通しがよいため別ファイルに分けます（例: `StepsItem.tsx` と `StepsItem.css.ts`）。

複数のコンポーネントで共有するフックは `src/hooks/` 直下に置きます（例: `src/hooks/useMergedRef.ts`）。単一コンポーネントでしか使わないフックは、上記のとおりそのコンポーネント配下の `hooks/` に置きます。

```
src/hooks/
├── useMergedRef.ts      # 実装
└── useMergedRef.spec.tsx # テスト
```

共有フックはライブラリ内部専用です。`src/main.tsx` からは export せず、barrel（`index.ts`）も置かずに実装ファイルを直接 import します（内部では barrel を経由しない規約に合わせる）。

フックではない共有のユーティリティ関数は `src/utils/` に置きます（例: `src/utils/dataAttribute.ts`）。扱う関心ごとにファイルを分け、共有フックと同じく内部専用として barrel を置かずに直接 import します。

```
src/utils/
├── dataAttribute.ts      # 実装
└── dataAttribute.spec.ts # テスト
```

## コーディング規約

**TypeScript / React:**

- 関数コンポーネントのみ: `export const ComponentName = ({ ...props }: Props) => { ... }`
- 型定義はすべて `interface` ではなく `type` を使用する。`any` は使用しない
- ネイティブな HTML 属性を展開するには `ComponentPropsWithRef<'tag'>` を使用する
- 条件付き className の結合には `clsx()` を使用する
- `useEffect` の使用は最小限に抑え、宣言的なパターンを優先する
- 深い `if/else` のネストを避け、条件が複数ある場合は `switch` を使用する
- **相互排他な見た目の選択肢は boolean ではなく文字列 union で表す**（`circle?: boolean` ではなく `shape?: 'rect' | 'circle'`）。選択肢が 3 つ目に増えても破壊的変更にならず、`data-*` 属性や `styleVariants()` のキーにそのまま使える。union は `SkeletonShape` のように名前付きで export する
  - ただし真偽で意味が完結する状態（`disabled` / `loading` / `error` / `required` など）は boolean のままでよい

**ref の扱い（React 19 の ref-as-prop）:**

- `ref` は通常の prop として受け取り、内部の DOM 要素へ転送する。`forwardRef` は使用しない
- 主となる DOM 要素をそのまま描画するコンポーネントは、`ComponentPropsWithRef<'tag'>` を使って `{...props}` で `ref` ごと転送する
- コンポーネント自身も DOM 要素を参照する場合は、`ref` を分割代入で取り出し `@/hooks/useMergedRef` で内部 ref とまとめる

  ```tsx
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(ref, inputRef);

  return <input ref={mergedRef} {...props} />;
  ```

- DOM プロパティの同期を ref callback の付け替えに頼らない。`ref` を外に出した以上、callback の identity が変わるたびに利用側の ref も付け外しされてしまう。属性で表現できない DOM プロパティ（`indeterminate` など）は `useMergedRef` で ref の identity を固定したうえで、`useEffect` で同期する

**compound components:**

- 複数の領域（ヘッダー・本文・フッターなど）を持つコンポーネントは、`title` / `footer` のような **ReactNode スロット prop ではなく合成**で組み立てる。パーツの有無は `showXxx` boolean ではなく「そのパーツを描画するかどうか」で表す
- パーツ間の共有値は context に持たせ、`useContext` ではなく `use()` で参照する。context の型は `state`（状態）/ `actions`（操作）/ `meta`（id や ref などの付帯情報）の 3 つに分ける
- context を取得するフックは、プロバイダの外側で呼ばれたら例外を投げて誤用を早期に知らせる
- パーツはルートのプロパティとしてぶら下げ、`<Dialog.Header>` のように使う。**このときルートだけは関数宣言で定義する**（アロー関数にはプロパティを生やせないため）。パーツ自体は通常どおりアロー関数でよい
- 利用側が独自のパーツを作れるよう、context のフックと型も公開する
- 描画を伴わない挙動のフラグ（`closeOnOverlayClick` など）は合成で表せないため、ルートの prop のまま残す
- ルートの状態（`disabled` やエラーなど）を **パーツではない子コンポーネント**（`Input` など）へ伝えるときは、`cloneElement` での注入ではなく子側に context を読ませる。子は自身の props を優先し、未指定のときだけ context の値を使う。単体でも使えるよう、この用途の取得フックは context が無くても例外を投げない
- `cloneElement` で子に注入してよいのは `id` / `aria-*` / `disabled` のように **DOM の属性として妥当なものだけ**。素の HTML 要素が子に来ても壊れないようにする。独自 prop（`error` など）は context 経由で伝える
- ルートからは子孫の描画有無を検査できないため、パーツ側から id を登録してもらい `htmlFor` や `aria-describedby` に反映する。存在しない id を指す属性は出力しない
- **`{...props}` は内部の指定より前に展開する**。compound components では `id` / `aria-*` がパーツ間の配線に使われるため、利用側の props に黙って上書きされると壊れ方が分かりにくい。上書きを許したい prop だけを明示的に分割代入し、`??` で「未指定のときだけ内部の値を使う」形にする

  ```tsx
  export function FormField({
    // グループとしての名前付けは利用側から上書きできるようにする
    role,
    'aria-labelledby': ariaLabelledBy,
    ...props
  }: FormFieldProps) {
    return (
      <div
        {...props}
        role={role ?? (isLabelledGroup ? 'group' : undefined)}
        aria-labelledby={ariaLabelledBy ?? (isLabelledGroup ? labelId : undefined)}
      />
    );
  }
  ```

- 内部でハンドラを持つ prop（`onClick` など）は、上書きさせるのではなく利用側のハンドラを呼んでから内部の処理を足す。利用側が取りやめられるよう、`event.defaultPrevented` を見て中断できる逃げ道を用意する

**import の使い分け:**

- `index.ts`（barrel）は **公開 API の境界** として使う。`src/main.tsx` からの再 export と、型の再 export の集約がその役割
- **ライブラリ内部**のコンポーネント間参照は、barrel ではなく実装ファイルを直接 import する（例: `import { Icon } from '../Icon/Icon'`）
  - barrel 同士が参照し合うと循環参照になりやすく、実行時に一方が `undefined` になる事故が起きる
  - barrel 経由では、必要のない兄弟 export までモジュールグラフに入る
  - ESLint の `no-restricted-imports` で機械的に担保している
- `*.stories.tsx` / `*.spec.tsx` は例外として barrel 経由を許容する。配布物に含まれず、利用者と同じ経路で import するほうがドキュメント・テストとして妥当なため

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
