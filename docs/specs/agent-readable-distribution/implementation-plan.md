# 実装計画: 利用側の AI エージェントが正しく使える情報を配布物に載せる

対象要件: [`requirements.md`](./requirements.md) / 対象設計: [`design.md`](./design.md)

## 前提

- 作業ブランチ: `feature/agent-readable-distribution`（`origin/main` から作成済み）
- 各フェーズの末尾に**検証ゲート**を置き、通過してから次へ進む
- フェーズ単位でコミットする。メッセージは英語・プレフィックス付き
- 本 spec は公開する情報を増やすだけで、コンポーネントの props の形・既定値・挙動は変えない（NFR-1）

## フェーズ構成の考え方

**フェーズ 5 の実地検証が本 spec の合否を決める。** それ以前は、その検証を可能にするための準備という位置づけである。

検査（フェーズ 2）を実装（フェーズ 1）の直後に置くのは、フェーズ 3 以降でファイルを増やす間、型の公開が壊れたらその場で落ちるようにするためである。最後に回すと、どの変更で壊れたのかの切り分けが要る。

```
1. 型の公開           … 15 ファイルの改名・union の名前付け・JSDoc
2. 公開漏れの検査     … verify:dist に tsc probe を載せる ★ここから先は壊したら即落ちる
3. ガイドの生成       … dist/AGENTS.md
4. README
5. 実地検証           … ★合否を決めるゲート
6. 仕上げ             … 規約の追記・全コマンドの通し
```

---

## フェーズ 1: 型の公開（FR-1 / FR-2 / FR-3 / FR-4）

### 1-1. 実装ファイルの `type Props` を改名して公開する（15 ファイル）

各ファイルで `type Props` → `export type ComponentNameProps` に変える。**props の中身は一切変えない。**

| ファイル | 新しい型名 |
| --- | --- |
| `Breadcrumb/Breadcrumb.tsx` | `BreadcrumbProps` |
| `Button/Button.tsx` | `ButtonProps` |
| `Checkbox/Checkbox.tsx` | `CheckboxProps` |
| `Icon/Icon.tsx` | `IconProps` |
| `IconButton/IconButton.tsx` | `IconButtonProps` |
| `Input/Input.tsx` | `InputProps` |
| `InputNumber/InputNumber.tsx` | `InputNumberProps` |
| `Radio/Radio.tsx` | `RadioProps` |
| `Select/Select.tsx` | `SelectProps` |
| `Skeleton/Skeleton.tsx` | `SkeletonProps` |
| `Spinner/Spinner.tsx` | `SpinnerProps` |
| `Switch/Switch.tsx` | `SwitchProps` |
| `Tag/Tag.tsx` | `TagProps` |
| `TextArea/TextArea.tsx` | `TextAreaProps` |
| `Tooltip/Tooltip.tsx` | `TooltipProps` |

### 1-2. インラインの union に名前を付ける（D-2）

`Button` / `IconButton` / `Spinner` の 3 ファイル。**型を切り出すだけで、値の集合は変えない。**

```ts
// Button.tsx
export type ButtonVariant =
  | 'default' | 'primary' | 'secondary' | 'success' | 'failure' | ZukkiVariantType;
export type ButtonSize = Exclude<SizeType, 'lg'>;

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  // …
};
```

| ファイル | 追加する型 |
| --- | --- |
| `Button/Button.tsx` | `ButtonVariant` / `ButtonSize` |
| `IconButton/IconButton.tsx` | `IconButtonVariant` / `IconButtonSize` |
| `Spinner/Spinner.tsx` | `SpinnerVariant` |

新しい型には **選択肢の意味が分かる JSDoc を付ける**。とくに `ButtonSize` / `IconButtonSize` は `Exclude<SizeType, 'lg'>` という式が `.d.ts` にそのまま出るため、なぜ `lg` が無いのかを書く。

### 1-3. `Tag` の JSDoc を補う（D-9 / FR-4）

`label` / `variant` / `className` / `onClose` の 4 つ。他コンポーネントの書き方に揃える。

### 1-4. barrel（`index.ts`）を更新する（15 ファイル）

```ts
// src/components/Button/index.ts
export { Button } from './Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button';
```

型名はアルファベット順に並べる（既存の `Card` / `Dialog` / `FormField` に揃える）。

### 1-5. `src/main.tsx` を更新する

- 15 コンポーネント分の Props 型と、1-2 で足した union 5 つを再 export
- `IconName`（型）と `iconNames`（値）を Icon から再 export（D-4）
- `ZukkiVariantType` を `./types` から再 export（D-3）
- `SizeType` / `sizeTypes` / `zukkiVariantTypes` は **export しない**

`Icon/index.ts` に `iconNames` の値 export を追加する必要がある（現状は型だけ）。

### 1-6. spec のローカル型定義を公開型に置き換える（D-1）

| ファイル | 現状 | 変更後 |
| --- | --- | --- |
| `Button/Button.spec.tsx` | `type ButtonProps = ComponentProps<typeof Button>` | `import { Button, type ButtonProps } from './Button'` |
| `IconButton/IconButton.spec.tsx` | `type IconButtonProps = ComponentProps<typeof IconButton>` | 同様 |
| `Skeleton/Skeleton.spec.tsx` | `type SkeletonProps = ComponentProps<typeof Skeleton>` | 同様 |

不要になった `ComponentProps` の import を消す（`noUnusedLocals` で落ちる）。

### 検証ゲート 1

```bash
pnpm typecheck && pnpm lint:check && pnpm format:check && pnpm test
```

さらにビルドして、型が届いているかを確認する。

```bash
pnpm build
```

| 確認項目 | 期待値 |
| --- | --- |
| `dist/main.d.ts` に現れる `Props` 型 | 19 コンポーネント分すべて |
| `dist/main.d.ts` の `IconName` / `iconNames` | 両方ある |
| `dist/components/Button/Button.d.ts` | `export type ButtonProps` があり、末尾の `export {}` だけになっていない |
| `dist/main.d.ts` の `SizeType` | **無い**（D-3 のとおり非公開） |
| `dist/components/Tag/Tag.d.ts` | 4 つの prop に JSDoc がある |

コミット: `feat: export props types and variant unions for all components`

---

## フェーズ 2: 公開漏れの検査（NFR-2 / D-7）

### 2-1. `scripts/probes/usage.tsx` を作る

受け入れ条件を型で固定する probe。`dist/main` を相対パスで import する。

**正のケース**（書けるべきもの）

- 各コンポーネントの Props 型を使ったラッパーコンポーネント（`Omit<ButtonProps, 'type'>` など）
- compound components の合成（`Card` / `Dialog` / `FormField` / `Steps`）
- `IconName` を受け取る関数、`iconNames` の走査
- `ZukkiVariantType` を使った独自の型

**負のケース**（`@ts-expect-error` で固定するもの）

| 対象 | 書くコード | 意図 |
| --- | --- | --- |
| `Button` の `variant` | `variant="danger"` | Issue の失敗例。正しくは `failure` |
| `Button` の `size` | `size="lg"` | Issue の失敗例。`lg` は禁止 |
| `IconButton` の `aria-label` | 省略する | 必須化が外れたら検知 |
| `Dialog` のスロット prop | `<Dialog title="…">` | 合成で組むもので、スロット prop は無い |
| `Card.Title` の `level` | `level={1}` | `HeadingLevel` は 2〜6 |
| `Icon` の `name` | `name="notExist"` | アイコン名の型が効いているか |

`@ts-expect-error` は**エラーが出なくなったときに逆にエラーになる**ため、型が緩んだことを検知できる。

### 2-2. `scripts/verify-dist.ts` に検査を足す

**(a) 全コンポーネントの Props 型が解決できる**

`src/components/` のディレクトリ一覧から probe を組み立て、`node_modules/.tmp/` に書き出す。ディレクトリが増えれば probe も自動的に増える。

**(b) (a) と `usage.tsx` をまとめて `tsc` に通す**

```
tsc --ignoreConfig --noEmit --skipLibCheck --strict
    --jsx react-jsx --moduleResolution bundler --module esnext --target es2022
    <生成した probe> scripts/probes/usage.tsx
```

`--ignoreConfig` は TypeScript 6 で必要（ファイルを直接指定すると `TS5112` になる）。実測で確認済み。

**(c) README の一覧が古くなっていないこと**

`src/components/` の全ディレクトリ名が `README.md` に現れることを検査する。フェーズ 4 で README を書くまでは落ちるので、**この検査だけフェーズ 4 で有効化する**。

### 検証ゲート 2

```bash
pnpm build && pnpm verify:dist
```

- 全項目が通ること
- **わざと壊して落ちることを確認する** — `src/main.tsx` から `ButtonProps` の export を一時的に外し、`verify:dist` が失敗することを確認してから戻す。検査が実際に機能しているかは、落ちるところを見ないと分からない

コミット: `test: verify public type surface against the built dist`

---

## フェーズ 3: ガイドの生成（FR-5 / D-5 / D-6）

### 3-1. `docs/agent-guide.template.md` を書く

D-6 の 7 節構成。散文は手で書き、3 つのプレースホルダを置く。

| 節 | 内容 | 生成 |
| --- | --- | --- |
| 1. はじめに読むこと | CSS の import が必須。忘れると無スタイルで描画される | 手 |
| 2. コンポーネント一覧 | 名前・一行説明・compound components かどうか | `{{COMPONENTS}}` |
| 3. compound components の組み方 | 4 つの合成例。スロット prop は無い | 手 |
| 4. アイコン | 使い方と全 17 種 | `{{ICON_NAMES}}` |
| 5. 型の使い方 | ラッパーの書き方・公開型の一覧 | `{{EXPORTED_TYPES}}` |
| 6. やりがちな間違い | 誤りと正解を並べる | 手 |
| 7. 配色 | `light-dark()` と `color-scheme`、CSS 3 種の選び方 | 手 |

**6 節は誤りと正解を並べて書く。** エージェントは近傍のコード例を模倣するため、正解だけを示すより効く。

```markdown
❌ <Button variant="danger">削除</Button>
✅ <Button variant="failure">削除</Button>
```

コンポーネントの一行説明は生成できないため、テンプレート側に名前と説明の対応表を持ち、スクリプトは**そこに載っていないコンポーネントがあればエラーにする**。一覧の網羅性は機械が保証し、説明文は人が書く形にする。

### 3-2. `scripts/build-agent-guide.ts` を作る

- 入力: テンプレート、`src/components/` のディレクトリ一覧、`src/components/Icon/types.ts` の `iconNames`、`src/main.tsx` の export
- 出力: `dist/AGENTS.md`
- `dist/` が無ければ作る（単体実行できるようにする。設計のリスク欄への対応）
- テンプレートに載っていないコンポーネントがあればエラー終了

### 3-3. `package.json` を更新する

```json
"build": "tsc -b && vite build && tsx scripts/build-css-variants.ts && tsx scripts/build-agent-guide.ts",
"build:agent-guide": "tsx scripts/build-agent-guide.ts",
```

`exports` に追加する。

```json
"./AGENTS.md": "./dist/AGENTS.md"
```

### 3-4. `verify-dist.ts` にガイドの検査を足す（D-7 の c）

- `dist/AGENTS.md` が存在する
- プレースホルダ（`{{`）が残っていない
- 19 コンポーネントの名前がすべて載っている
- 17 個のアイコン名がすべて載っている

### 検証ゲート 3

```bash
pnpm build && pnpm verify:dist
```

生成された `dist/AGENTS.md` を**実際に読んで**確認する。

- 型と重複した説明を書いていないか（D-6）
- compound components の例がそのまま動く形か
- 「やりがちな間違い」に Issue の失敗例が入っているか

`npm pack --dry-run --json` の中身に `dist/AGENTS.md` が含まれることも確認する。

コミット: `feat: ship a usage guide for agents in the published package`

---

## フェーズ 4: README（FR-6 / D-8）

### 4-1. 「コンポーネント」の節を追加する

「使い方」の直後、「配色の選び方」の前。

- 19 コンポーネントの一覧表（名前と一行説明）
- compound components の最小例（`Card` / `Dialog` / `FormField` / `Steps` のうち 1〜2 個）
- 型を使ったラッパーの例

### 4-2. 「AI エージェントで使う場合」の節を追加する

**この節がガイドの到達率を決める。** エージェントが `node_modules` を自力で探す保証は無いため、利用側の設定ファイルから読ませる手順を書く。

```markdown
利用側の `AGENTS.md` / `CLAUDE.md` から次を読み込ませてください。

    @./node_modules/zukki-design-system/dist/AGENTS.md
```

### 4-3. `verify-dist.ts` の README 検査を有効化する（2-2 の c）

### 検証ゲート 4

```bash
pnpm verify:dist
```

- README の検査が通る
- **わざとコンポーネントを 1 つ README から消して落ちることを確認する**

コミット: `docs: add component list and agent guide pointer to README`

---

## フェーズ 5: 実地検証（FR-7）★合否ゲート

**ここが本 spec の核心である。** 型を export しただけでは「エージェントが正しく書ける」ことの保証にならない。

### 5-1. 利用側プロジェクトを用意する

作業ディレクトリはリポジトリ外（スクラッチ領域）に置く。

```bash
pnpm pack                       # prepare が走り、フルビルドされる
# 別の場所に Vite + React + TypeScript のプロジェクトを作り、tarball を install
```

### 5-2. 機械的に確認する

| 確認項目 | 手段 |
| --- | --- |
| パッケージ名で型が解決できる | `import type { ButtonProps } from 'zukki-design-system'` を `tsc` に通す |
| 19 個すべての Props 型が名指しできる | 同上 |
| `variant="danger"` / `size="lg"` が型エラーになる | `tsc` の出力を確認 |
| `IconName` / `iconNames` が届く | 同上 |
| `dist/AGENTS.md` が `node_modules` にある | ファイルの存在確認 |
| `zukki-design-system/AGENTS.md` が解決できる | `require.resolve` |
| JSDoc が補完に出る | `.d.ts` を読んで確認 |
| CSS を import するとスタイルが当たる | ビルドして CSS 変数を確認 |

### 5-3. エージェントに書かせて確認する

**ライブラリの中身を知らない状態のエージェントに、`node_modules` だけを情報源としてコンポーネントを書かせる。** 確認するのは要件 FR-7 の 5 項目。

- 存在しない `variant` / `size` を書かない
- CSS の import を忘れない
- compound components をスロット prop ではなく合成で組む
- アイコン名を推測で書かない
- Props 型を使ってラッパーを書ける

**この手順はサブエージェントの起動を伴うため、実施前にユーザーに確認する。** 起動しない場合は 5-2 までを本 spec の検証範囲とし、5-3 は利用側プロジェクトでの宿題として `results.md` に残す。

### 5-4. 見つかった問題を反映する

エージェントが詰まった箇所は、そのままガイドの不足である。テンプレートに追記して再度確認する。

### 検証ゲート 5

5-2 の全項目が通ること。5-3 を実施した場合は、5 項目のうち何が通り何が通らなかったかを記録すること。

コミット: `docs: record the consumer-side verification results`

---

## フェーズ 6: 仕上げ

### 6-1. `AGENTS.md`（リポジトリの規約）に追記する

- `dist/AGENTS.md` は生成物であり、手編集しないこと
- ガイドの内容を変えるときは `docs/agent-guide.template.md` を編集すること
- コンポーネントを追加したら、Props 型の公開・テンプレートの説明・README の一覧が要ること（3 つとも `verify:dist` が落ちるので気づけるが、先に書いてある方が早い）

### 6-2. `results.md` を書く

既存 spec に倣い、実測値と残った課題を残す。

### 検証ゲート 6（最終）

CI と同じ内容を通す。

```bash
pnpm lint:check
pnpm format:check
pnpm typecheck
pnpm test
pnpm test:a11y
pnpm build
pnpm verify:dist
```

コミット: `docs: document the generated agent guide in the repository guidelines`

---

## 想定される差し戻し

| 起きうること | 対応 |
| --- | --- |
| `type Props` の改名で stories / spec が落ちる | 1-6 で 3 ファイルを直す。それ以外に参照は無いことを確認済みだが、落ちたら都度直す |
| `Exclude<SizeType, 'lg'>` が `.d.ts` で展開されず読みにくい | JSDoc で選択肢を明記する（1-2）。それでも不足なら `'sm' | 'md'` を直接書く案に切り替える |
| `tsc` の probe が `verify:dist` を大きく遅くする | `--skipLibCheck` で足りなければ、probe の対象を Props 型の解決だけに絞る |
| ガイドが長くなりすぎて読まれない | D-6 のとおり型と重複する内容を削る。目安は 200 行以内 |
| フェーズ 5 でガイドの不足が見つかる | 5-4 でテンプレートに反映して再確認する。フェーズ 3 に戻る想定を最初から持っておく |
