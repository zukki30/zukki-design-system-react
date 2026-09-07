# 要件: 利用側の AI エージェントが正しく使える情報を配布物に載せる

対象 Issue: [#90 利用側の AI エージェントが正しく使える情報を配布物に載せる](https://github.com/zukki30/zukki-design-system-react/issues/90)

## 背景

[#89](https://github.com/zukki30/zukki-design-system-react/issues/89) で「配布物として成立させる」ところまでは終わった。`dist/` に `.d.ts` が出るようになり、README には install と CSS の読み込み手順が載った。

残っているのは **中身** である。利用側のプロジェクトで動くエージェントが参照できる情報源は 3 つしかない。

| # | 情報源 | #89 後の状態 |
| --- | --- | --- |
| 1 | `node_modules` 内の `.d.ts` | 出力されるようになった。ただし**名前で参照できる型が足りない** |
| 2 | README | install / CSS / 配色 / 対応ブラウザまでは書かれた。**コンポーネントの使い方が無い** |
| 3 | `package.json` の `exports` | 定義済み（`.` と CSS 3 種） |

器はできたが、器に載る情報が足りていない。本 spec はそこを埋める。

## 現状（実測値）

すべて現在の `main`（`7e62175`）のソースと、`dist/` のビルド成果物を読んで確認した事実である。

### A. Props 型が 19 コンポーネント中 15 で未 export

`src/components/` 直下は 19 ディレクトリ。Props 型を公開しているのは 4 つだけで、いずれも compound components 化のときに合わせて公開されたものである。

| 状態 | コンポーネント |
| --- | --- |
| 公開済み（4） | `Card` / `Dialog` / `FormField` / `Steps` |
| **未公開（15）** | `Breadcrumb` / `Button` / `Checkbox` / `Icon` / `IconButton` / `Input` / `InputNumber` / `Radio` / `Select` / `Skeleton` / `Spinner` / `Switch` / `Tag` / `TextArea` / `Tooltip` |

未公開の 15 個はすべて、ファイル内で `type Props` という名前になっている。ファイルローカルの呼称なので、そのまま公開すると 15 個の `Props` が衝突する。

ビルド後の `.d.ts` にもそのまま現れる。

```ts
// dist/components/Button/Button.d.ts（末尾）
export declare const Button: ({ children, ... }: Props) => import("react").JSX.Element;
export {};   // ← Props は export されていない
```

利用側は `ComponentProps<typeof Button>` で間接的に取り出すしかない。動きはするが、**エージェントがその回避策に自力で辿り着く保証は無い**うえ、ラッパーの props をひとつずつ書き直す羽目になる。

### B. `IconName` が公開エントリに出ていない

```ts
// src/components/Icon/index.ts
export type { IconName } from './types';   // ← ここにはある
```

`src/main.tsx` は `export { Icon } from './components/Icon';` だけで、型を再 export していない。結果として `dist/main.d.ts` にも `IconName` が現れない。

17 種類のアイコン名（`baselineMinus` / `calendarMonth` / `checkboxMarkedCircle` / `chevronDown` / `chevronLeft` / `chevronRight` / `chevronUp` / `close` / `closeCircle` / `eye` / `eyeOff` / `github` / `home` / `menuDown` / `menuUp` / `outlineCheck` / `windowRestore`）を**型から発見する手段が無い**。

### C. 共有型が公開されていないのに、`.d.ts` はそれを参照している

`dist/main.d.ts` が再 export している型は `HeadingLevel` のみ。一方で個別の `.d.ts` は次を参照している。

```ts
// dist/components/Button/Button.d.ts（先頭）
import { SizeType, ZukkiVariantType } from '../../types';
```

`SizeType`（`'sm' | 'md' | 'lg'`）と `ZukkiVariantType`（`'profile' | 'works' | 'outputs'`）は `src/types/index.ts` にあるが、公開エントリからは名指しできない。`Button` / `IconButton` / `Tag` の 3 つがこれを props に使っている。

### D. 選択肢を持つ prop に、名前の付いていない union が 3 件ある

| コンポーネント | prop | 定義 | 名前 |
| --- | --- | --- | --- |
| `Button` | `variant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'failure' \| ZukkiVariantType` | **無し（インライン）** |
| `IconButton` | `variant` | `'primary' \| 'secondary' \| 'primary-exposed' \| 'secondary-exposed'` | **無し（インライン）** |
| `Spinner` | `variant` | `'light' \| 'dark' \| 'primary' \| 'accent'` | **無し（インライン）** |
| `Tag` | `variant` | — | `TagVariant`（公開済み） |
| `Breadcrumb` | `variant` | — | `BreadcrumbVariant`（公開済み） |
| `Tooltip` | `placement` | — | `TooltipPlacement`（公開済み） |
| `Skeleton` | `shape` | — | `SkeletonShape`（公開済み） |

同じ性質の prop で扱いが割れている。Issue に挙がっている失敗例（`variant="danger"` と書く／`<Button size="lg">` と書く）は、まさにこの 3 件で起きる。

### E. JSDoc はほぼ揃っている。欠けているのは `Tag` だけ

props に付いた日本語 JSDoc を数えた。

```
全 prop 定義: 73 個
JSDoc あり  : 69 個（94.5%）
JSDoc 無し  : 4 個 — すべて Tag の label / variant / className / onClose
```

`.d.ts` には JSDoc がそのまま出ているため、**コンポーネントを書き始めたあとの補完は既に効く**。届いていないのは「型を名指しする」経路のほうである。

### F. README にコンポーネントの使い方が無い

現在 123 行。#89 で install / CSS の読み込み / 配色の選び方 / ビルド設定の注意 / 対応ブラウザまでは整備された。一方で残りは開発者向けの内容（ディレクトリ構成・トークン生成手順・Web フォント）で、**どんなコンポーネントがあるのか、compound components をどう組むのかは書かれていない**。

### G. 配布物にガイドを載せる器が無い

```json
"files": ["dist", "README.md"]
```

`exports` にもドキュメント用のエントリは無い。ガイドを追加するなら、置き場所と `files` / `exports` への追加を決める必要がある。

### H. `verify:dist` は型の公開状況を検査していない

`scripts/verify-dist.ts`（120 行）が見ているのは、必要なファイルの存在・React の外部化・`main.d.ts` にエイリアスが残っていないこと・CSS 3 種の中身・`npm pack` の中身。**「全コンポーネントの Props 型が公開されているか」は検査対象外**なので、コンポーネントを増やしたときに公開し忘れても気づけない。

## 機能要件

### FR-1: すべてのコンポーネントの Props 型を公開する

- 19 コンポーネントすべてで、props の型を `src/main.tsx` から名前付きで export すること
- 名前は既に公開済みの 4 つに合わせ、`ComponentNameProps` の形にすること（`ButtonProps` / `InputProps` …）
- 利用側がラッパーコンポーネントを次のように書けること

  ```tsx
  import type { ButtonProps } from 'zukki-design-system';

  export const SubmitButton = (props: Omit<ButtonProps, 'type'>) => (
    <Button {...props} type="submit" />
  );
  ```

### FR-2: 選択肢を持つ prop の union に名前を付けて公開する

- 上記 D のインライン union 3 件に名前を与え、公開すること
- 命名は公開済みのもの（`TagVariant` / `BreadcrumbVariant` / `TooltipPlacement` / `SkeletonShape`）に揃えること
- 型の側から選択肢を列挙できるようにし、`variant="danger"` のような存在しない値がエラーになること

### FR-3: 共有型を公開する

- `IconName` を `src/main.tsx` から export すること
- `Button` / `IconButton` / `Tag` の props が参照している共有型を、利用側から名指しできるようにすること
- **ただし内部専用のものは公開しない。** `src/hooks/` の共有フックと `src/utils/` は「ライブラリ内部専用」と規約で定めているため、公開 API に混ぜないこと

### FR-4: JSDoc の欠落を埋める

- `Tag` の 4 つの prop に日本語 JSDoc を付けること
- 新しく公開する型（FR-2 の union）にも、何を選ぶものかが分かる説明を付けること

### FR-5: 利用側エージェント向けのガイドを配布物に含める

型だけでは伝わらない前提がある。次を含むガイドを配布物に載せること。

- **CSS の import が必須であること**（読み込まないと色も余白も当たらない）
- **コンポーネントの一覧**と、それぞれが何をするものか
- **compound components の組み方** — `Card` / `Dialog` / `FormField` / `Steps` はスロット prop ではなく合成で組む。`<Dialog title="...">` と書いても通らない
- **アイコン名の一覧**（17 種類）
- **やりがちな間違い** — `variant="danger"`（正しくは `failure`）、`<Button size="lg">`（Button は `lg` を禁止している）

「配布物に含める」とは、利用側が `node_modules` を起点に到達できることを指す。README しか読まないエージェントにも届く経路にすること。

### FR-6: README にコンポーネントの使い方を追加する

- どんなコンポーネントがあるのかを一覧できること
- compound components の最小の組み方が載っていること
- 現在の README の構成（install → 使い方 → 配色 → 対応ブラウザ）を崩さず、開発者向けの節（ディレクトリ構成・トークン生成）と混ざらないように配置すること

### FR-7: 実際にエージェントに使わせて確認する

**この要件が本 spec の核心である。** 型を export しただけでは「エージェントが正しく書ける」ことの保証にならない。

別プロジェクトに install し、ライブラリの中身を知らない状態のエージェントに次を書かせて確認すること。

- 存在しない `variant` / `size` を書かず、型に無い値を選ばない
- CSS の import を忘れない
- compound components をスロット prop ではなく合成で組む
- アイコン名を推測で書かない
- Props 型を使ってラッパーコンポーネントを書ける

## 非機能要件

### NFR-1: 破壊的変更を出さない

- 既に公開している export 名（`CardProps` / `DialogProps` / `FormFieldProps` / `StepsProps` など）を変えないこと
- コンポーネントの props の形・既定値・挙動を変えないこと。本 spec は**公開する情報を増やすだけ**で、API そのものは変えない
- ファイル内の `type Props` をリネームする場合も、影響は実装ファイル内に閉じること

### NFR-2: 公開し忘れを CI で検知する

コンポーネントは今後も増える。手作業のチェックリストでは必ず抜ける。

- `src/components/` の各ディレクトリについて、Props 型が公開エントリから参照できることを機械的に検査すること
- 検査は `pnpm verify:dist` に載せ、CI でブロックすること（上記 H）

### NFR-3: 既存の開発フローを壊さない

- `pnpm dev` / `test` / `test:a11y` / `lint:check` / `format:check` / `typecheck` / `verify:dist` がすべて成功すること

### NFR-4: 情報の二重管理を避ける

アイコン名の一覧やコンポーネント一覧は、ソースから導出できる情報である。ガイドに手で書き写すと必ず古くなる。**生成するか、生成しないなら古くなったことを検知できる形にすること。**

## スコープ外

- **CSS Modules への移行** — [#84](https://github.com/zukki30/zukki-design-system-react/issues/84)。本対応と独立に行える
- **新しいコンポーネントの追加・既存 API の変更** — 本 spec は公開する情報を増やすだけで、API は変えない（NFR-1）
- **npm レジストリへの publish** — #89 と同じく運用判断
- **Storybook の docs 拡充** — 利用側のエージェントは Storybook を参照できない。本 spec が扱うのは `node_modules` から届く経路のみ
- **`Tag` 以外の JSDoc の書き直し** — 69/73 は既に付いており、質の見直しは別途

## 判断が必要な論点

設計フェーズで決める。

### 1. ガイドをどの形式で、どこに置くか

利用側のエージェントに届く経路が形式によって変わる。

| 案 | 置き場所 | 届き方 |
| --- | --- | --- |
| README に統合 | `README.md` | `files` に既にあり追加作業が要らない。ただし開発者向けの内容と混ざり、README が長くなる |
| 独立ファイルを同梱 | `AGENTS.md` など | 役割が分かれて読みやすい。`files` への追加が必要。エージェントが `node_modules` 内のファイルを自力で探す保証は無い |
| `exports` から参照可能にする | `zukki-design-system/AGENTS.md` | パスが安定し、案内すれば確実に届く。README からの誘導が要る |

複数を組み合わせる案もある（README に要点＋詳細は別ファイル）。

### 2. インライン union に付ける名前

`ButtonVariant` / `IconButtonVariant` / `SpinnerVariant` が素直だが、`Button` の `size` のように `Exclude<SizeType, 'lg'>` となっているものをどう名前付けるか（`ButtonSize` として公開するか、`SizeType` の公開で足りるとするか）も併せて決める。

### 3. 共有型（`SizeType` / `ZukkiVariantType`）を公開するか

| 案 | 内容 | 論点 |
| --- | --- | --- |
| そのまま公開 | `SizeType` / `ZukkiVariantType` を `main.tsx` から export | 名前が汎用的すぎて、利用側の型と衝突しうる |
| 名前を付け替えて公開 | `ZukkiSize` など接頭辞を揃える | 内部の呼称と公開名がずれる |
| コンポーネント固有型に閉じる | `ButtonSize` / `ButtonVariant` だけ公開し、共有型は内部に留める | 利用側に見える型が増えすぎない。ただし `ZukkiVariantType` は 3 コンポーネントで共通なので重複する |

`sizeTypes` / `zukkiVariantTypes` / `iconNames` という **値の配列**も併せて公開するかを決める。公開すればエージェントが実行時に選択肢を列挙でき、Storybook の argTypes も型から導ける。

### 4. ファイル内の `type Props` をどう扱うか

15 ファイルで `type Props` を `ComponentNameProps` にリネームする。実装ファイル内に閉じた変更だが、`.stories.tsx` / `.spec.tsx` からの参照有無を確認して一括で行う。

### 5. NFR-2 の検査をどう実装するか

`verify:dist` は `dist/` を文字列として読む方式（120 行）で、型システムを使っていない。「Props 型が公開されているか」は、`dist/main.d.ts` の文字列検査で足りるのか、TypeScript の API で解決するのかを決める。

## 受け入れ条件

- [ ] 19 コンポーネントすべての Props 型が `zukki-design-system` から import できる
- [ ] 既に公開していた型の名前が変わっていない（破壊的変更が無い）
- [ ] `IconName` が公開エントリから import できる
- [ ] `Button` / `IconButton` / `Spinner` の `variant` が名前付き型として公開されている
- [ ] `Button` に `size="lg"` を渡すと型エラーになることを、利用側プロジェクトで確認した
- [ ] `Button` に `variant="danger"` を渡すと型エラーになることを、利用側プロジェクトで確認した
- [ ] `Tag` の 4 つの prop に JSDoc が付き、`.d.ts` に出ている
- [ ] 利用側エージェント向けのガイドが配布物に含まれ、`npm pack` の中身に入っている
- [ ] ガイドに CSS の import 必須・コンポーネント一覧・compound components の組み方・アイコン名一覧・やりがちな間違いが載っている
- [ ] アイコン名やコンポーネント一覧が、ソースとずれたときに検知できる（または生成されている）
- [ ] README からコンポーネントの使い方に辿り着ける
- [ ] Props 型の公開漏れが `pnpm verify:dist` で検知され、CI でブロックされる
- [ ] **別プロジェクトでエージェントにコンポーネントを書かせ、推測で書かずに済むことを実際に確認した**（FR-7 の 5 項目）
- [ ] `pnpm dev` / `test` / `test:a11y` / `lint:check` / `format:check` / `typecheck` / `verify:dist` がすべて成功する
