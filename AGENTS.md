# Repository Guidelines

このファイルが、本リポジトリの規約の **唯一の正** です。Claude Code / Codex / Cursor / Cline のいずれで作業する場合も、ここに書かれた内容に従ってください。

- `CLAUDE.md` は本ファイルを読み込むだけのポインタです。**規約を追記・変更するときは本ファイルだけを編集** してください。同じ内容を 2 箇所に書くと必ず片方が古くなります
- ツール固有の設定（skills や permissions など）は `.codex/` と `.claude/` に置きます。規約そのものは置きません

## コミュニケーション

- 応答は日本語で書く。コード・コマンド名・コミットメッセージは英語のまま扱う
- 説明は簡潔に、分かりやすく書く

## 依頼者について

ユーザーはフロントエンドを主担当とするエンジニアです。ライブラリ選定・環境構築・実装・テスト作成は自身で判断できるため、時短のために実装を依頼しています。

一方でバックエンド / インフラ / GitHub Actions は専門外です。これらの領域では実装だけでなく、なぜその方法を採るのかとベストプラクティスの提示まで含めて対応してください。

## 対応ブラウザ

優先するのは Google Chrome 最新版です。加えて以下を想定します。

| 環境 | ブラウザ |
| --- | --- |
| Windows | Chrome / Edge / Firefox 各最新版 |
| Mac | Chrome / Safari / Firefox 各最新版 |
| スマートフォン・タブレット | iOS 最新の Safari / Chrome、Android 最新の Chrome |

## 開発環境

ツールチェーンは `.mise.toml` で固定しています（Node 24.14.1 / pnpm 10.33.0）。`mise install` でセットアップしてください。パッケージマネージャは pnpm です（`package.json` の `packageManager` で固定）。

## コマンド

```bash
# 開発（Storybook をポート 6006 で起動）
pnpm dev

# ビルド（型宣言 + Vite バンドル + 配布用 CSS 3 種類）
pnpm build

# Lint & フォーマット
pnpm lint            # 自動修正あり
pnpm format          # 自動修正あり
pnpm lint:check      # 修正せず検査のみ（CI と同じ）
pnpm format:check    # 修正せず検査のみ（CI と同じ）
pnpm typecheck       # tsc -b のみ（バンドルなし）

# 配布物
pnpm verify:dist     # dist が利用側から使える形かを検査（CI と同じ）

# テスト
pnpm test           # 単発実行（jsdom のユニットテスト）
pnpm test:watch     # ウォッチモード
pnpm test:coverage  # カバレッジ付き
pnpm test:a11y      # 全ストーリーを実ブラウザで動かして a11y を検査（ライト / ダーク両配色）

# デザイントークン（Figma → CSS 変数）
pnpm token:transform   # Figma エクスポート → JSON
pnpm build:tokens      # JSON → CSS 変数（両対応版 + 配色固定版 2 種）

# CSS Modules のクラス名の型
pnpm build:css-types   # *.module.css.d.ts を生成する
pnpm check:css-types   # 生成物が最新かを検査する（CI と同じ）
```

## アーキテクチャ

TypeScript と CSS Modules で構築した **React コンポーネントライブラリ**（デザインシステム）です。コンポーネントは Storybook 上でドキュメント化・開発します。

**技術スタック:** React 19 / TypeScript 6 / Vite 8 / CSS Modules / Vitest 5 / Storybook 10

**ライブラリのエントリポイント:** `src/main.tsx` で全コンポーネントを export します。Vite は ES モジュール（`zukki-design-system.js`）と CJS（`zukki-design-system.cjs`）の両方を出力します。配布物の詳細は「配布物」の節を参照してください。

**デザイントークンのパイプライン:** Figma（tokens.json）→ `pnpm token:transform` → `style-dictionary/tokens/*.json` → `pnpm build:tokens` → `src/styles/variables*.css`。

生成されるのは 3 つです。`variables.css` が `light-dark()` を保持した両対応版、`variables-light-only.css` / `variables-dark-only.css` が配色を固定した版で、後者 2 つは配布 CSS の固定版を作るときに使います。

すべてのコンポーネントスタイルは、この意味的な CSS 変数を `var(--color-primary-default)` の形で直接参照します。

**その他の置き場所:** `figma/tokens.json` は Tokens Studio のエクスポートで、変換は `style-dictionary/` が担います。Vitest の環境設定は `test/setup.ts` です。生成物（`src/styles/variables*.css`、`*.module.css.d.ts`）は手編集しません。

## 配布物

このライブラリは git 経由で install して使われます。`dist/` はリポジトリに含めず、`prepare` スクリプトが install 時にビルドします。

**`pnpm build` が作るもの:**

| 成果物 | 備考 |
| --- | --- |
| `zukki-design-system.js`（ESM） / `.cjs`（CJS） | React は外部化され、バンドルに含みません |
| `main.d.ts` ほか型宣言 | `vite-plugin-dts` が `@/` エイリアスを相対パスへ解決します |
| `styles.css` | 既定。`light-dark()` を保持します |
| `styles-light.css` / `styles-dark.css` | `scripts/build-css-variants.ts` が既定版から派生生成します |
| `styles*.css.d.ts` | CSS の副作用 import 用。TypeScript 6 は型解決を検査するため、無いと利用側が `TS2882` になります |
| `AGENTS.md` | 利用側の AI エージェント向けガイド。`scripts/build-agent-guide.ts` が生成します |

**公開 API やビルド設定を変えたら `pnpm verify:dist` を通してから完了とすること。** CI でも同じ検査が走ります。

次の 4 つは**ビルドが成功したままでも壊れる**ため、設定を触るときは特に注意してください。

- **React の外部化**（`build.rollupOptions.external`）— 外れると React がバンドルに同梱され、利用側で二重に読み込まれて `Invalid hook call` になります
- **`build.cssTarget`** — 外れると `light-dark()` がポリフィルへ変換されます。ポリフィルは `prefers-color-scheme` にしか反応せず、要素の `color-scheme` による切り替えができなくなります。値は README の対応ブラウザと揃えてください
- **CJS の拡張子** — `package.json` が `type: module` なので、CJS を `.js` で出すと Node が ESM として解釈します。`require()` は例外を投げないまま **export が空になる**ため気づきにくく、`.cjs` である必要があります
- **`exports` の `types` 条件** — 外れると利用側が `TS2882`（CSS の副作用 import）や `TS7016`（本体）で落ちます。ファイル自体は出力されているため、存在だけを見る検査では気づけません

最後の 1 つがあるため、**`scripts/probes/` の probe は import 元をパッケージ名（`zukki-design-system`）で書きます。** `../../dist/main` のような相対パスにすると `exports` を一度も通らず、壊れていても検査が通ってしまいます。自分自身をパッケージ名で解決できるのは Node / TypeScript の self-reference によるもので、`name` と `exports` があれば効くため symlink も一時的な install も要りません。

配色を固定した CSS は、ビルド済み CSS から `:root { … }` を丸ごと落とし、`src/styles/variables-{light,dark}-only.css` を前置して作ります（`scripts/build-css-variants.ts`）。コンポーネントは `:root` を使わないため、これで変数定義だけを正確に切り離せます。

**落とし残しと落としすぎの両方を検査しています。** 残せば固定版に `light-dark()` が残り、落としすぎれば固定版から変数が消えます。後者はファイルが出力されているぶん気づきにくいため、`verify:dist` が「固定版に既定 CSS と同じ変数がそろっている」ことを見ています。

### 利用側に届ける情報

利用側のプロジェクトで動くエージェントが参照できるのは、`node_modules` の `.d.ts` と `README.md`、そして同梱した `dist/AGENTS.md` だけです。3 つを揃えておくこと。

- **公開する型はコンポーネント固有の名前にする。** props は `ComponentNameProps`、選択肢を持つ prop の union は `ButtonVariant` のように名前を付けて公開します。`SizeType` のような汎用的な名前は利用側の型と衝突するため公開しません
- **`dist/AGENTS.md` は生成物です。手編集しないこと。** 内容を変えるときは `docs/agent-guide.template.md` を編集し、`pnpm build:agent-guide` で生成し直します。コンポーネント一覧・アイコン名・公開している型・compound components とそのパーツはソースから差し込まれるため、手で書き写しません
- **compound components の一覧を手で持たないこと。** どれが合成かとパーツの顔ぶれは `Card.Header = CardHeader;` のような代入から読んでいます（`scripts/lib/sources.ts`）。手書きの一覧を足すと、コンポーネントを追加したときにそこだけが古くなり、しかも名前は載っているぶん網羅性の検査は通ってしまいます

**コンポーネントを追加したときに要る作業は 3 つ**で、compound かどうかによらず同じです。いずれも忘れると `pnpm verify:dist` が落ちます。

1. Props 型を `src/main.tsx` まで公開する
2. `docs/agent-guide.template.md` の `descriptions` に説明を書く
3. `README.md` のコンポーネント一覧に足す（compound なら説明に `（合成）` を付ける）

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
├── ComponentName.module.css      # CSS Modules スタイル
├── ComponentName.module.css.d.ts # 生成物。手編集しない
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
├── ComponentName.module.css
├── ComponentName.module.css.d.ts
└── index.ts
```

パーツはルートと同じ `ComponentName.tsx` に置きます。ただし専用の `.module.css` を持つパーツは、スタイルとセットで独立させたほうが見通しがよいため別ファイルに分けます（例: `StepsItem.tsx` と `StepsItem.module.css`）。

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
- **React の型・値は `react` からの named import で参照し、`React` 名前空間は使わない**（`React.ReactNode` ではなく `import type { ReactNode } from 'react'`）。`@types/react` が `React` を UMD グローバルとして宣言しているため、名前空間参照はファイル内に import が無くても型が通ってしまい、暗黙のグローバル依存になる。値（`React.useState`）と JSX（`<React.Fragment>`）も同様。ESLint の `no-restricted-syntax` で機械的に担保している
- 条件付き className の結合には `clsx()` を使用する
- `useEffect` の使用は最小限に抑え、宣言的なパターンを優先する
- 深い `if/else` のネストを避け、条件が複数ある場合は `switch` を使用する
- **相互排他な見た目の選択肢は boolean ではなく文字列 union で表す**（`circle?: boolean` ではなく `shape?: 'rect' | 'circle'`）。選択肢が 3 つ目に増えても破壊的変更にならず、`data-*` 属性の値にそのまま使える。union は `SkeletonShape` のように名前付きで export する
  - ただし真偽で意味が完結する状態（`disabled` / `loading` / `error` / `required` など）は boolean のままでよい

**任意 prop の条件描画:**

`ReactNode` や文字列を受け取る任意 prop をラッパー要素で包んで描画するときは、`&&` の左辺に prop をそのまま置かない。`0` や `NaN` がテキストとして漏れる。判定は用途で使い分ける。

- **装飾（アイコンなど）は truthy 三項** — `''` / `0` / `false` はすべて未指定として扱い、ラッパーごと描画しない。中身が空のまま残ると `gap` や `padding` の余白だけが空いてしまうため

  ```tsx
  {startIcon ? <span className={inputIcon} aria-hidden="true">{startIcon}</span> : null}
  ```

  この挙動は「falsy な値はアイコン未指定として扱う」と JSDoc に明記する

- **テキスト・ラベルは `@/utils/renderableNode` の `isRenderable()`** — React が何も描画しない値（`null` / `undefined` / `boolean`）だけを未指定として扱い、`''` / `0` は描画する。`<Checkbox>{count}</Checkbox>` で `count` が `0` のときラベルが黙って消えるのを防ぐ

  ```tsx
  {isRenderable(children) && <span className={checkboxLabel}>{children}</span>}
  ```

- **素の比較（`!= null` / `!== undefined`）で済ませない。** どちらも `{cond && label}` が偽のときに渡る `false` を「指定あり」と判定してしまい、中身が空のラッパーが残る。`!== undefined` はさらに `{cond ? icon : null}` の `null` も取りこぼす
- 描画の有無を prop から算出する箇所（`Select` の `defaultValue` など）は、判定を `hasPlaceholder` のような変数に括り出して描画側と共有する。同じ条件式を 2 箇所に書くと、片方だけ書き換えられて壊れる
- boolean / 関数 prop（`loading` / `onClose` など）は falsy 値が漏れないため `&&` のままでよい
- 装飾を包む span に `aria-hidden` を付けるかはコンポーネントごとに判断する。`Icon` は `aria-label` の有無で自身の `aria-hidden` を出し分けるため、ラッパー側で一律に隠すと利用側が意味を持たせたアイコンまで隠れてしまう

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

**タイトルの見出しレベル:**

- タイトルを描画するパーツ（`Card.Title` / `Dialog.Title` など）は、`level?: HeadingLevel` で見出しレベルを受け取り `h2`〜`h6` を出し分ける。`role="heading"` と `aria-level` を利用側に組ませない。片方だけ渡されると無効な ARIA になり、ライブラリ側では防げないため
- `HeadingLevel`（`2 | 3 | 4 | 5 | 6`）は複数コンポーネントで共有するため `src/types` に置く。`h1` はページ全体の見出しなので含めない。レベルからタグ名への変換は `@/utils/headingTag` の `headingTag()` を使う
- **省略時に見出しにするかは「ライブラリが正しいレベルを決められるか」で決める**

  | パーツ | 省略時 | 理由 |
  | --- | --- | --- |
  | `Card.Title` | `div`（見出しなし） | カードが文書構造のどの階層に置かれるかはライブラリ側から分からない。勝手にレベルを決めず、必要なときだけ利用側が指定する |
  | `Dialog.Title` | `h2` | ダイアログの中は背景が inert になる独立したコンテキストで、タイトルは常にその最上位の見出しにあたる |

- 描画する要素が `div` と `h2`〜`h6` で変わるパーツは、`ref` を共通の親である `HTMLElement` で受け取る。`ComponentPropsWithRef<'div'>` の `ref` は `HTMLDivElement` に固定されるため、`Omit<..., 'ref'>` してから広げる

  ```tsx
  export type CardTitleProps = {
    level?: HeadingLevel;
    ref?: Ref<HTMLElement>;
  } & Omit<ComponentPropsWithRef<'div'>, 'ref'>;
  ```

- 見出ししか描画しないパーツ（`Dialog.Title`）は `h2`〜`h6` がいずれも `HTMLHeadingElement` なので、`ComponentPropsWithRef<'h2'>` のままでよい
- **タグ名が可変の描画は JSX ではなく `createElement()` で組み立てる**。JSX で書くには `const Heading = headingTag(level)` のように大文字始まりの変数へ入れる必要があり、`react-hooks/static-components` に「レンダーごとにコンポーネントを作っている」と誤検知される。実際に渡しているのはタグ名の文字列なので識別子は毎回同じで、再マウントは起きない

  ```tsx
  return createElement(level === undefined ? 'div' : headingTag(level), {
    ...props,
    ref,
    className: clsx(cardTitle, className),
  });
  ```

**import の使い分け:**

- `index.ts`（barrel）は **公開 API の境界** として使う。`src/main.tsx` からの再 export と、型の再 export の集約がその役割
- **ライブラリ内部**のコンポーネント間参照は、barrel ではなく実装ファイルを直接 import する（例: `import { Icon } from '../Icon/Icon'`）
  - barrel 同士が参照し合うと循環参照になりやすく、実行時に一方が `undefined` になる事故が起きる
  - barrel 経由では、必要のない兄弟 export までモジュールグラフに入る
  - ESLint の `no-restricted-imports` で機械的に担保している
- `*.stories.tsx` / `*.spec.tsx` は例外として barrel 経由を許容する。配布物に含まれず、利用者と同じ経路で import するほうがドキュメント・テストとして妥当なため

**スタイリング（CSS Modules）:**

- スタイルはすべて `ComponentName.module.css` に書く。TSX からは `import styles from './ComponentName.module.css'` で読む
- **クラス名は BEM に従い、修飾子（`--`）は使わない。** ブロックはコンポーネント名の camelCase、要素は `__` で継ぐ（`.button` / `.button__inner` / `.button__label`）。`__` を含む名前は JavaScript の識別子として妥当なので `styles.button__inner` とドットで引ける。`-` を含む名前を作らないのはこのため
- 値は意味的な CSS 変数を `var(--color-primary-default)` の形で直接参照する（色・余白などのハードコード禁止）
- **相互排他な見た目の選択肢は `data-*` 属性で表す。** 既存の `data-selected` / `data-error` / `data-loading` と書き味が揃い、パーツの出し分けを親セレクタから書けるため TSX 側で `buttonLabel[size]` のような受け渡しが要らなくなる

  ```tsx
  <button className={styles.button} data-variant={variant} data-size={size}>
    <span className={styles.button__label}>{children}</span>
  </button>
  ```

  ```css
  .button[data-variant='primary'] {
    background-color: var(--color-primary-default);
  }
  .button[data-size='sm'] .button__label {
    font-size: var(--font-size-xs);
  }
  ```

- **入れ子にできるコンポーネントは、子孫セレクタで値を配らない。** `Card` のように自身の内側へ自身を置けるものは、`.card[data-size='sm'] .card__body` が内側のパーツにも同じ詳細度で当たり、勝敗が出力順で決まってしまう。**継承するカスタムプロパティに値を持たせ**、内側が上書きする形にする。パーツがルート直下にあるかどうかにも依存しなくなる

  ```css
  .card {
    --zds-card-padding: var(--spacing-2xl);
  }
  .card[data-size='sm'] {
    --zds-card-padding: var(--spacing-xl);
  }
  .card__body {
    padding: var(--zds-card-padding);
  }
  ```

- **CSS で持つ独自のカスタムプロパティには `--zds-<component>-` を前置する。** 変数名は CSS Modules のスコープ対象外で、利用側の変数と衝突しうる。ファイルローカルな定数（サイズや導出値）はこの形で持ち、`calc()` の中で意図が読めるようにする
- **数値には必ず単位を書く。** `border-width: 1` は無効値で、宣言ごと破棄される
- 共有 mixin は `src/styles/mixins.module.css` から `composes:` で引く。**パスは相対で書く**（`@/` エイリアスは `composes … from` の解決経路を通らず、`fileResolve` の戻り値が絶対パスでないとしてビルドが落ちる）

  ```css
  .tag__label {
    composes: truncate from '../../styles/mixins.module.css';
  }
  ```

- **モーション低減（`prefers-reduced-motion`）は共有せず、各ルールの中に直接書く。** 別クラスにすると `transition: none` とベースの `transition` が別ルールの宣言になり、勝敗が出力順（＝どのファイルが先に import されたか）に依存する。同一ルール内ならベース宣言より後に置かれ、順序によらず上書きできる

  ```css
  .button {
    transition: background-color 0.2s ease-in-out;

    @media (prefers-reduced-motion: reduce) {
      transition: none;
      animation: none;
    }
  }
  ```

  同じ理由で、`mixins.module.css` に置いてよいのは「宣言だけで、引く側の宣言と衝突しないもの」に限る

- **要素セレクタはスコープされない。** `option` や `svg` は素の要素セレクタとして書ける（`.select__field option { … }`）。グローバルへ書き出す仕掛けは要らない
- **サイズなど、CSS と TSX の両方が知る必要のある値は CSS に寄せる。** 例えば `Tag` の閉じるアイコンは `.tag__closeButton > svg { width: 100% }` で大きさを決め、`<Icon>` に `width` / `height` を渡さない。両方に数値を書くと必ず片方が古くなる
- **クラス名の型は生成物。** `*.module.css.d.ts` を `pnpm build:css-types` で生成してコミットする。これが無いと `vite/client` の索引シグネチャが効き、`styles.buttonn` のような綴り違いが型エラーにならず黙って「クラス未適用」になる。クラス名は Vite の `css.modules.getJSON` から受け取っているので、`composes` の扱いも含めて実ビルドと必ず一致する

**配色トークンの使い分け:**

配色は「面」と「その上に載るテキスト」を **必ず対で** 選ぶ。ライト・ダークで反転する側としない側を混ぜると、片方の配色で文字が背景に沈む。

| 面 | その上のテキスト | 使う場所 |
| --- | --- | --- |
| `surface.page` | `textOnSurface.*` | ページ背景の上に直接置くもの（Breadcrumb / Steps / FormField のラベルなど） |
| `surface.raised` | `textOnSurface.*` | ページから浮いた面（Card / Dialog） |
| `surface.inverse` | `textOnInverse.default` | 面を反転させて目立たせるもの（Tooltip） |
| `{semantic}.default` / `.hover` / `.seleted`（アクセント塗り） | `textOnAccent.default` | Button / IconButton / Steps の現在ステップ |
| `surface.page` / `surface.raised` | `{semantic}.text` | 意味カラーを面の上の**文字・アイコン**として使うとき（Breadcrumb の現在ページ、FormField の必須マーク） |
| `input.background.*` | `textOnLight.*` | `inputColorSchemeLight` でライト固定にした入力面の **内側だけ** |

- **`grey` などの生のプリミティブを面や文字色に使わない。** プリミティブのランプはライトとダークで反転するため、反転しない `textOnLight` / `textOnAccent` と組むと壊れる（Card の `grey.0` × `textOnLight`、Tooltip の `grey.900` × `textOnDark` がこれだった）。区切り線や淡い塗りは `surface.subtle` を使う
- **`textOnLight.*` はライト固定の面の内側専用。** ライト・ダークで同じ濃色を返すため、ページ面の上で使うとダーク配色で読めなくなる
- **意味カラー（`primary` / `success` / `profile` …）は「塗り」と「文字」で段が分かれている。** 同じ色を両方に使い回さない。塗りは濃色ラベルを載せる前提で明るく、文字は面に対して読める濃さが要るため、必要な明度が逆になる

  | ロール | 契約 | ライト / ダーク |
  | --- | --- | --- |
  | `default` | 塗り。`textOnAccent.default`（両配色とも `#15171a`）に対して 4.5:1 以上 | 同じ値。**塗りは配色で変わらない** |
  | `hover` / `seleted` | `default` の 1 段 / 2 段明るい側 | 同じ値 |
  | `strong` | `hover` と同じ段 | 同じ値 |
  | `text` | 面の上の文字・アイコン。`surface.page` と `surface.raised` の**両方**に対して 4.5:1 以上 | ライトは濃く、ダークは明るい |

- 塗りが両配色とも明るいため、`hover` / `seleted` は**明るくなる方向**にしか動かせない（濃くするとラベルが 4.5:1 を割る）。ライト配色では選択状態が淡く見えるが、ラベルのコントラストは保たれる
- Button のように塗りの上へ重ねるスピナーは `Spinner` の `accent` バリアントを使う。`light` / `dark` は背景の明暗に合わせるもので、アクセント塗りには合わない
- **配色を変えるときは `figma/tokens.json` を直す。** `src/styles/variables*.css` は `pnpm token:transform && pnpm build:tokens` の生成物で、直接編集しても次回の生成で巻き戻る

**テスト:**

- export された関数はすべてテストする。`if/else` は両分岐、`switch` は全 case を網羅する
- テストファイル: `*.spec.ts` または `*.test.ts`
- テストは 2 系統に分かれる。`vitest.config.ts` の `projects` で環境ごとに分離している
  - `pnpm test` … jsdom 上のユニットテスト（`unit` プロジェクト）
  - `pnpm test:a11y` … 全ストーリーを Chromium で描画し `axe-core` にかける（`a11y-light` / `a11y-dark` プロジェクト）

**a11y の検査:**

静的解析（`pnpm lint:check` の `jsx-a11y`）と実行時検査（`pnpm test:a11y`）の 2 層で見る。どちらも CI でブロックされるため、**実装後は両方を通してから完了とすること**。

- 実行時検査を実ブラウザで行うのは、`color-contrast` やフォーカスの視認性など**レンダリングしないと判定できない領域**があるため。jsdom ではこれらが丸ごと検査対象外になる
- 配色は `light-dark()` で定義されているため、ライト / ダークの両方を検査する。切り替えは `.storybook/preview.tsx` の `theme` グローバルと decorator が担い、テスト側は `storybookTest({ initialGlobals: { theme } })` で同じ経路を通る
- **キャンバスには `.storybook/preview.css` で `surface.page` を当てている。** これが無いと Storybook 既定の白い背景の上でダーク配色が描画され、ホストアプリと違う面でコントラストが測られてしまう。ライブラリ側で `body` にスタイルを当てるわけにはいかないため、Storybook 専用に置いている
- **操作しないと現れない状態は、そのままでは検査されない。** ストーリーが既定で描画している状態だけが対象になるため、開いた状態のダイアログなどは専用のストーリーを用意する（`Dialog` の `Opened` が例）

違反が出たときの対処は次の順で判断する。

1. **ストーリーの組み方が原因なら、ストーリーを直す。** 単体で使うと名前が付かないコンポーネントに `aria-label` を与える、複数のランドマークを並べたストーリーで名前を振り分ける、など
2. **コンポーネントの実装が原因なら、実装を直す**
3. **デザイン判断を伴うものだけ繰り延べる。** 対象の meta で該当ルールだけを無効化し、理由と追跡先の Issue 番号をコメントに残す。`test: 'todo'` はそのコンポーネントの全ルールを非ブロックにしてしまうため使わない

```ts
parameters: {
  // TODO(#123): 〈何が基準を満たしていないか〉。
  // 修正は Figma 側のデザイン判断を伴うため #123 で追跡する。
  // color-contrast だけを外し、他のルールは error のまま維持する
  a11y: {
    config: {
      rules: [{ id: 'color-contrast', enabled: false }],
    },
  },
},
```

- **`heading-order` は無効化しない。** `Card.Title` / `Dialog.Title` の `level` prop がこのルールの対象そのものであり、切るとコンポーネント自身の欠陥を見逃す。ストーリー側の見出し構成が原因なら、ルールではなくストーリーを直す

**パスエイリアス:** `@/*` は `src/*` に解決される

## Agent Skills

チーム全員が使えるよう、skills をリポジトリに入れています。実体は `.codex/skills/` にあり、`.claude/skills/` は同じディレクトリへの相対シンボリックリンクです（Git のモード `120000`）。Codex と Claude Code の双方から同じものが見えます。タスクの目的に合うものがあれば使ってください。

> Windows で作業する場合は `git config core.symlinks true`（＋ 開発者モードか管理者権限）を設定してください。無効だとシンボリックリンクがテキストファイルとして checkout されます。

- `react-best-practices` — React のパフォーマンスと実装レビュー
- `web-design-guidelines` — UI・アクセシビリティ・UX の監査
- `composition-patterns` — 拡張に耐える React コンポーネント API の設計
- `webapp-testing` — ブラウザを使った結合確認
- `tdd` — 振る舞い起点の red-green-refactor

## セキュリティ

- 認証情報や API キーはハードコードせず環境変数から読む。リポジトリに含めない
- ユーザー入力を DOM へ流す箇所では XSS を検討する
- 依存パッケージの脆弱性は Dependabot（`.github/dependabot.yml`）で追跡している

## Git コミット

- 英語のメッセージで、プレフィックスを付ける: `feat`、`fix`、`chore`、`refactor`、`test`、`docs`、`style`、`ci`、`perf`、`revert`
- 件名は簡潔に。例: `feat: add Tooltip component` / `fix: correct Dialog focus handling`

## Pull Request

- 利用者から見て何が変わるかを書く。関連 Issue があればリンクする
- テストを含める。見た目が変わる場合は Storybook のスクリーンショットを添える
- トークンを再生成した場合と、破壊的な API 変更がある場合は明記する
- 提出前に `pnpm lint:check`、`pnpm format:check`、`pnpm typecheck`、`pnpm test`、`pnpm test:a11y` を通す（CI と同じ内容）

## ブランチ

作業は `main` ブランチから派生したブランチで行ってください。ブランチ名は `feature/xxx`、`fix/xxx`、`chore/xxx` の形式で作成します。
