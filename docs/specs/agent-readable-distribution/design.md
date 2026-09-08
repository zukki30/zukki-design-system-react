# 設計: 利用側の AI エージェントが正しく使える情報を配布物に載せる

対象要件: [`requirements.md`](./requirements.md)

## 検証済みであること

設計の前提は実地で確認した。現在の `dist/`（`main` のビルド成果物）に対して `tsc` を走らせた結果である。

| 検証項目 | 結果 |
| --- | --- |
| `dist/main.d.ts` の型を外部から名指しできるか | ✅ `CardProps` は解決できる |
| 未 export の型が検知できるか | ✅ `ButtonProps` は `error TS2305: has no exported member` になる |
| `tsc` で配布物の型を検査できるか | ✅ `--ignoreConfig` 付きなら repo の tsconfig に影響されず単独実行できる |
| `scripts/` が `tsc -b` の対象に入っているか | ❌ 入っていない（`tsconfig.app.json` は `src` のみ、`tsconfig.node.json` は vite / vitest の設定のみ）。検査用の probe を置いても `pnpm typecheck` を汚さない |
| JSDoc が `.d.ts` に残るか | ✅ 既に残っている（`dist/components/Button/Button.d.ts` に日本語コメントが出ている） |
| 配布物に開発用ファイルが混ざらない検査 | `scripts/verify-dist.ts` が `dist/` 以外を弾いている。**ガイドを repo 直下に置くとこの検査に引っかかる** |

最後の 1 点が、ガイドの置き場所（要件の論点 1）を決める材料になった。

## 全体構成

```
pnpm build
  ├─ tsc -b
  ├─ vite build (+ vite-plugin-dts)        … 型の公開はここに乗る
  ├─ scripts/build-css-variants.ts
  └─ scripts/build-agent-guide.ts   ★新規  … dist/AGENTS.md を生成

pnpm verify:dist
  └─ scripts/verify-dist.ts
       ├─ 既存の検査（ファイル・React 外部化・CSS・npm pack）
       ├─ ★ dist/AGENTS.md の中身が現在のソースと一致するか
       └─ ★ tsc による型の解決検査（probe を実行）
```

配布物の形。★が本 spec で増える分。

```
dist/
├── zukki-design-system.js / .cjs
├── main.d.ts + components/**/*.d.ts   … 公開する型が増える
├── styles.css / styles-light.css / styles-dark.css
└── AGENTS.md  ★                       … 利用側エージェント向けガイド（生成物）
```

## 決定事項

### D-1: `type Props` は `ComponentNameProps` にリネームして公開する

15 ファイルの `type Props` を `ButtonProps` のように改名し、`export` を付ける。ファイル内の呼称なので影響は実装ファイルに閉じており、既に公開済みの 4 つ（`CardProps` / `DialogProps` / `FormFieldProps` / `StepsProps`）と命名が揃う。

公開の経路は既存と同じ **実装 → コンポーネントの `index.ts` → `src/main.tsx`** とする。`index.ts` は公開 API の境界という規約（AGENTS.md）に沿う。

```ts
// src/components/Button/Button.tsx
export type ButtonProps = { ... } & Omit<ComponentPropsWithRef<'button'>, ...>;

// src/components/Button/index.ts
export { Button } from './Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './Button';

// src/main.tsx
export { Button } from './components/Button';
export type { ButtonProps, ButtonSize, ButtonVariant } from './components/Button';
```

**副次的な整理:** `Button.spec.tsx` / `IconButton.spec.tsx` / `Skeleton.spec.tsx` は `type ButtonProps = ComponentProps<typeof Button>` という回避策をローカルに置いている。公開型ができるのでこれを import に置き換える。テストが利用側と同じ経路を通ることになり、型の公開が壊れたらテストでも気づける。

### D-2: 選択肢を持つ prop の union に名前を付ける

インラインの 3 件に名前を与える。`Button` / `IconButton` の `size` も同様に名前を付ける。**`Exclude<SizeType, 'lg'>` という式のままでは、エージェントが選択肢を読み取るのに `SizeType` の定義まで辿る必要がある**ためである。

| 型 | 定義 | 備考 |
| --- | --- | --- |
| `ButtonVariant` | `'default' \| 'primary' \| 'secondary' \| 'success' \| 'failure' \| ZukkiVariantType` | Issue の失敗例 `variant="danger"` はここ |
| `ButtonSize` | `Exclude<SizeType, 'lg'>` | Issue の失敗例 `size="lg"` はここ |
| `IconButtonVariant` | `'primary' \| 'secondary' \| 'primary-exposed' \| 'secondary-exposed'` | |
| `IconButtonSize` | `Exclude<SizeType, 'lg'>` | `ButtonSize` と同じ形だが別名にする。片方だけサイズが増えても破壊的変更にならない |
| `SpinnerVariant` | `'light' \| 'dark' \| 'primary' \| 'accent'` | |

既に名前が付いている `TagVariant` / `BreadcrumbVariant` / `TooltipPlacement` / `SkeletonShape` / `CardSize` / `StepsOrientation` / `FormFieldOrientation` / `FormFieldRequiredMark` と扱いが揃う。

`Exclude<...>` は `.d.ts` にそのまま出るため、**定義に「どの値が使えるか」を書いた JSDoc を添える**（FR-4）。

```ts
/**
 * ボタンのサイズ。`sm` / `md` の 2 段階。
 *
 * `lg` は意図的に持たない。大きい面を占めるボタンは Card のアクションなど
 * レイアウト側で幅を与えて表現する
 */
export type ButtonSize = Exclude<SizeType, 'lg'>;
```

### D-3: 共有型は `ZukkiVariantType` だけ公開し、`SizeType` は公開しない

要件の論点 3。**コンポーネント固有型に閉じる**方針を基本とし、例外を 1 つだけ設ける。

| 型 | 公開 | 理由 |
| --- | --- | --- |
| `SizeType` | **しない** | 名前が汎用的すぎて利用側の型と衝突する。用途は `ButtonSize` / `IconButtonSize` で完全に覆える |
| `ZukkiVariantType` | **する** | `profile` / `works` / `outputs` という zukki サイト固有の概念で、`Button` / `IconButton` / `Tag` の 3 つに共通して現れる。`Zukki` 接頭辞があり衝突しない。利用側が独自コンポーネントを作るときに必要になる |
| `HeadingLevel` | する（現状維持） | 既に公開済み。外すと破壊的変更になる |

**公開しない型を props が参照していても、型解決は壊れない。** `dist/components/Button/Button.d.ts` は `import { SizeType } from '../../types'` と書いており、`dist/types/index.d.ts` は配布物に含まれている。名指しできないだけで、`ButtonProps['size']` は正しく `'sm' | 'md'` に解決される。実測で確認済み。

値の配列（`sizeTypes` / `zukkiVariantTypes`）は公開しない。型で足りるうえ、`SizeType` を公開しないのに `sizeTypes` だけ出るのは筋が通らない。

### D-4: `IconName` と `iconNames` を公開する

`IconName` は型。`iconNames`（`as const` の配列）は**値としても公開する**。ここだけ D-3 の判断と分けるのは、アイコン一覧が利用側で実際に必要になるためである。

- アイコンのピッカーや一覧を利用側で作るとき、17 個を手で書き写さずに済む
- エージェントが実行時に選択肢を列挙できる
- `iconNames` はライブラリ固有の名前で、衝突しない

### D-5: ガイドは `dist/AGENTS.md` としてビルド時に生成する

要件の論点 1。**「独立ファイルを同梱」＋「`exports` から参照可能にする」の組み合わせ**を採る。ただし置き場所は repo 直下ではなく `dist/` とする。

**repo 直下に置けない理由が 2 つある。**

1. repo 直下の `AGENTS.md` は**このリポジトリで作業する人向けの開発規約**であり、利用側に配るものではない。同名で別内容のファイルを 2 つ置くことになる
2. `scripts/verify-dist.ts` が「配布物に `dist/` 以外が混ざっていないこと」を検査している。repo 直下にガイドを置くとこの検査の例外リストを緩めることになり、開発用ファイルの混入を検知する力が落ちる

`dist/` に生成すれば、`files: ["dist", "README.md"]` に手を入れずに配布物へ入り、既存の検査もそのまま通る。

`package.json` の `exports` にエントリを足し、パスを安定させる。

```json
"./AGENTS.md": "./dist/AGENTS.md"
```

**ビルド時に生成する（コミットしない）ことが要件 NFR-4 への答えになる。** コンポーネントやアイコンを増やしたとき、ガイドは次のビルドで自動的に追従する。古くなりようがない。

生成の入出力。

```
docs/agent-guide.template.md     … 手で書く。散文とプレースホルダ
        +
src/components/*/                … コンポーネント一覧
src/components/Icon/types.ts     … アイコン名一覧
src/main.tsx                     … 公開している型の一覧
        ↓  scripts/build-agent-guide.ts
dist/AGENTS.md
```

テンプレートに埋めるプレースホルダは 3 つ。

| プレースホルダ | 差し込む内容 |
| --- | --- |
| `{{COMPONENTS}}` | 19 コンポーネントの一覧（名前と、compound components かどうか） |
| `{{ICON_NAMES}}` | `iconNames` の全要素 |
| `{{EXPORTED_TYPES}}` | `src/main.tsx` が export している型名 |

散文（compound components の組み方・やりがちな間違い・CSS の import）はテンプレート側に手で書く。生成できない情報だからである。

### D-6: ガイドの中身は「型で伝わらないこと」に絞る

`.d.ts` は既に届いており、prop 単位の JSDoc も 94.5% 揃っている。**ガイドで型と同じことを書くと二重管理になる。** 型から読み取れないものだけを書く。

```markdown
1. はじめに読むこと      … CSS の import が必須であること。忘れると無スタイルで描画される
2. コンポーネント一覧    … {{COMPONENTS}}
3. compound components   … スロット prop ではなく合成で組む。<Dialog title="..."> は通らない
4. アイコン              … {{ICON_NAMES}}
5. 型の使い方            … {{EXPORTED_TYPES}} とラッパーの書き方
6. やりがちな間違い      … variant="danger" / size="lg" / CSS 忘れ / スロット prop
7. 配色                  … light-dark() と color-scheme。3 種類の CSS の選び方
```

「やりがちな間違い」は **誤りと正解を並べて書く**。エージェントは近傍のコード例を強く模倣するため、正解だけを書くより誤りを明示するほうが効く。

### D-7: 公開漏れの検査は `tsc` による型解決で行う

要件の論点 5 / NFR-2。`verify-dist.ts` に 2 つの検査を足す。

**(a) 全コンポーネントの Props 型が解決できること（生成した probe）**

`src/components/` のディレクトリ一覧から probe を組み立て、`dist/main.d.ts` に対して `tsc` を通す。ディレクトリが増えれば probe も自動的に増えるので、**新しいコンポーネントの公開し忘れが必ず落ちる**。

```ts
// node_modules/.tmp/ に生成する probe（イメージ）
import type { BreadcrumbProps, ButtonProps, /* …19 個 */ } from '../../dist/main';
type _0 = BreadcrumbProps;
// …
```

文字列一致ではなく `tsc` を使うのは、**「名前が main.d.ts に現れる」ことと「利用側から解決できる」ことが別物**だからである。barrel の再 export が抜けていれば文字列検査は通ってしまう。

**(b) 受け入れ条件を型で固定する probe（手で書く）**

`scripts/probes/usage.tsx` を用意し、`@ts-expect-error` で「エラーになるべきもの」を固定する。`@ts-expect-error` は**エラーが出なくなったときに逆にエラーになる**ため、型が緩んだことを検知できる。

```tsx
// @ts-expect-error size に lg は無い
<Button size="lg">送信</Button>;
// @ts-expect-error variant に danger は無い（正しくは failure）
<Button variant="danger">削除</Button>;
```

compound components の組み方（`<Dialog title="...">` が通らないこと）も同じ形で固定する。

(a) と (b) を 1 回の `tsc` 実行でまとめて検査する。`--ignoreConfig` を付けて repo の tsconfig から切り離す（実測で確認済み）。probe は `dist/main` を相対パスで import する。パッケージ名（`zukki-design-system`）での解決は FR-7 の実 install 検証で確認するため、ここでは重複させない。

**(c) `dist/AGENTS.md` の鮮度**

生成物なので理屈のうえでは常に最新だが、`build` の実行順が崩れて古いものが残る事故はありうる。プレースホルダが残っていないこと・19 コンポーネントと 17 アイコンがすべて載っていることを検査する。

### D-8: README はコンポーネント一覧とガイドへの誘導を足す

現在の README の構成（install → 使い方 → 配色 → 対応ブラウザ → 開発者向け）を崩さない。「使い方」と「配色の選び方」の間に 2 節を挿す。

```
## 使い方
### コンポーネント          ★新設  一覧表と compound components の最小例
### AI エージェントで使う場合 ★新設  dist/AGENTS.md への誘導
### 配色の選び方
```

**「AI エージェントで使う場合」の節が、ガイドが実際に届くかどうかを決める。** エージェントが `node_modules` の中を自力で探す保証は無いため、利用側の設定ファイルから読ませる手順を書く。

```markdown
利用側の `AGENTS.md` / `CLAUDE.md` から次を読み込ませてください。

    @./node_modules/zukki-design-system/dist/AGENTS.md
```

README のコンポーネント一覧は手で書く。生成の対象にすると README 全体が生成物になり、開発者向けの節まで巻き込まれるためである。代わりに **`verify:dist` で「`src/components/` の全ディレクトリ名が README に現れること」を検査**し、追加し忘れを落とす（NFR-4）。

### D-9: `Tag` の JSDoc を補う

欠けている 4 つ（`label` / `variant` / `className` / `onClose`）に日本語 JSDoc を付ける。他コンポーネントの書き方に揃える。

## 公開 API の変化

`src/main.tsx` から export される型の一覧。★が新規。

| コンポーネント | 現状 | 追加 |
| --- | --- | --- |
| `Breadcrumb` | `BreadcrumbItem` / `BreadcrumbVariant` | ★`BreadcrumbProps` |
| `Button` | — | ★`ButtonProps` / ★`ButtonVariant` / ★`ButtonSize` |
| `Card` | `CardProps` ほか 8 型 | — |
| `Checkbox` | — | ★`CheckboxProps` |
| `Dialog` | `DialogProps` ほか 6 型 | — |
| `FormField` | `FormFieldProps` ほか 8 型 | — |
| `Icon` | — | ★`IconProps` / ★`IconName` / ★`iconNames`（値） |
| `IconButton` | — | ★`IconButtonProps` / ★`IconButtonVariant` / ★`IconButtonSize` |
| `Input` | — | ★`InputProps` |
| `InputNumber` | — | ★`InputNumberProps` |
| `Radio` | — | ★`RadioProps` |
| `Select` | — | ★`SelectProps` |
| `Skeleton` | `SkeletonShape` | ★`SkeletonProps` |
| `Spinner` | — | ★`SpinnerProps` / ★`SpinnerVariant` |
| `Steps` | `StepsProps` ほか 3 型 | — |
| `Switch` | — | ★`SwitchProps` |
| `Tag` | `TagVariant` | ★`TagProps` |
| `TextArea` | — | ★`TextAreaProps` |
| `Tooltip` | `TooltipPlacement` | ★`TooltipProps` |
| 共通 | `HeadingLevel` | ★`ZukkiVariantType` |

**削除・改名は 1 件も無い。** 追加のみなので破壊的変更にならない（NFR-1）。

## 変更するファイル

| 種別 | ファイル | 内容 |
| --- | --- | --- |
| 実装 | `src/components/*/[Component].tsx` × 15 | `type Props` の改名と `export`。union の名前付け |
| 実装 | `src/components/Tag/Tag.tsx` | 上記に加えて JSDoc を追加 |
| 実装 | `src/components/*/index.ts` × 15 | 型の再 export |
| 実装 | `src/main.tsx` | 型の再 export。`iconNames` は値として export |
| テスト | `Button` / `IconButton` / `Skeleton` の `*.spec.tsx` | ローカルの `ComponentProps<typeof X>` を公開型の import に置き換え |
| 新規 | `docs/agent-guide.template.md` | ガイドの散文とプレースホルダ |
| 新規 | `scripts/build-agent-guide.ts` | `dist/AGENTS.md` を生成 |
| 新規 | `scripts/probes/usage.tsx` | 受け入れ条件を型で固定する probe |
| 変更 | `scripts/verify-dist.ts` | D-7 の (a)(b)(c) と README の検査を追加 |
| 変更 | `package.json` | `build` にガイド生成を追加。`exports` に `./AGENTS.md` |
| 変更 | `README.md` | コンポーネント一覧とガイドへの誘導 |
| 変更 | `AGENTS.md` | `dist/AGENTS.md` が生成物であること（手編集しない）を明記 |

## リスクと対応

| リスク | 対応 |
| --- | --- |
| `type Props` の改名で参照が壊れる | 実装ファイル内に閉じた型。stories / spec からの参照は 3 ファイルのみで、公開型の import に置き換える。`pnpm typecheck` で全件落ちる |
| 公開する型が増えて表面積が広がる | 追加するのはすべて props とその選択肢で、内部実装は出さない。`src/hooks/` と `src/utils/` は規約どおり非公開のまま |
| ガイドがビルドに依存し、開発中に確認しづらい | `scripts/build-agent-guide.ts` を単体でも実行できるようにする |
| 生成したガイドが冗長になり読まれない | D-6 のとおり型と重複しない内容に絞る |
| `tsc` の probe 実行で `verify:dist` が遅くなる | 対象は probe 2 ファイルと `dist/*.d.ts` のみ。`--skipLibCheck` を付ける |

## 未決事項（実装計画フェーズで詰める）

- `scripts/probes/usage.tsx` に入れる負のケースの具体的な件数と内容
- ガイドのテンプレートの文面（`docs/agent-guide.template.md` の実文）
- FR-7 の検証で使う利用側プロジェクトの用意の仕方（#89 の検証手順を再利用できるか）
