<!--
  dist/AGENTS.md のテンプレート。

  ここを編集して `pnpm build:agent-guide` を実行すると dist/AGENTS.md が生成される。
  dist/AGENTS.md は生成物なので直接編集しない。

  プレースホルダはビルド時にソースから差し込まれる。
  - {{COMPONENTS}}      … 下の descriptions ブロックと src/components/ から生成
  - {{COMPOUND_NAMES}}  … `Card.Header = ...` のような代入から生成
  - {{COMPOUND_PARTS}}  … 同上。パーツの一覧を手で書き写さない
  - {{ICON_NAMES}}      … src/components/Icon/types.ts から生成
  - {{EXPORTED_TYPES}}  … src/main.tsx から生成

  下の descriptions に載っていないコンポーネントがあると生成が失敗する。
  一覧の網羅性は機械が保証し、説明文だけを人が書く。

  descriptions:
  Breadcrumb: 現在地までの階層を示すパンくずリスト。`items` に配列で渡す
  Button: ラベルを持つボタン
  Card: 情報のまとまりを載せる面
  Checkbox: 複数選択のチェックボックス。`indeterminate` に対応する
  Dialog: モーダルダイアログ。開閉は `open` prop で制御する
  FormField: ラベル・補助テキスト・エラーメッセージをまとめるフォームフィールド
  Icon: 組み込みのアイコン。`name` で選ぶ
  IconButton: アイコンだけのボタン。`aria-label` が必須
  Input: 1 行のテキスト入力。前後にアイコンを置ける
  InputNumber: 数値入力。ソフトキーボードを `step` / `min` から出し分ける
  Radio: 単一選択のラジオボタン
  Select: ドロップダウンの選択。`children` に `option` を並べる
  Skeleton: 読み込み中のプレースホルダー
  Spinner: 読み込み中のスピナー
  Steps: 手順の進捗を示すステップ
  Switch: オン / オフの切り替え
  Tag: 短いラベルを示すタグ。`onClose` を渡すと閉じるボタンが出る
  TextArea: 複数行のテキスト入力
  Tooltip: 補足を示す吹き出し
-->

# zukki-design-system を使うためのガイド

React のデザインシステムです。**このファイルは配布物に同梱された生成物**で、install されているバージョンの実際の中身から作られています。

型と JSDoc は `.d.ts` に入っています。**ここには型から読み取れないことだけを書いています。**

## 1. 最初に読むこと

**CSS を必ず読み込んでください。** 色も余白もすべて CSS 変数で定義されているため、読み込まないと無スタイルで描画されます。アプリのエントリポイントで 1 回だけ import します。

```tsx
import 'zukki-design-system/styles.css';
```

そのうえでコンポーネントを import します。

```tsx
import { Button, Card } from 'zukki-design-system';
```

React 19（`^19.0.0`）が必要です（peer dependency）。

## 2. コンポーネント一覧

{{COMPONENTS}}

「合成」の列が ✓ のものは compound components です。3 節を読んでください。

## 3. compound components の組み方

{{COMPOUND_NAMES}} は、**パーツを子として合成して組み立てます。**

**スロット prop はありません。** `title` や `footer` に ReactNode を渡す API ではないため、次は型エラーになります。

```tsx
❌ <Dialog open title="確認" footer={<Button>OK</Button>}>本文</Dialog>
```

正しくは、描画したいパーツを子として置きます。パーツの有無は「置くかどうか」で表します（`showFooter` のような boolean はありません）。

```tsx
✅
<Dialog open={open} onClose={() => setOpen(false)}>
  <Dialog.Header>
    <Dialog.Title>確認</Dialog.Title>
    <Dialog.Close />
  </Dialog.Header>
  <Dialog.Body>削除しますか？</Dialog.Body>
  <Dialog.Footer>
    <Button variant="failure">削除</Button>
  </Dialog.Footer>
</Dialog>
```

各コンポーネントのパーツ。

{{COMPOUND_PARTS}}

### 覚えておくこと

- **`Dialog` の開閉は `open` prop だけで制御します。** `ref` から `showModal()` / `close()` を呼ばないでください。`onClose` は「閉じる要求」で、実際に閉じるかどうかは `open` が決めます
- **`FormField` の状態は子へ自動的に伝わります。** `disabled` とエラー状態は context で入力要素に渡るため、`<Input error disabled>` と書き直す必要はありません
- **ただし `FormField` の `required` が注入するのは `aria-required` だけです。** 支援技術には必須と伝わりますが、**ブラウザのネイティブ検証（送信時のブロック）は効きません。** 必要な場合は `<Input required>` を自分で指定してください
- **`FormField.Control` が注入するのは子が単一の要素のときだけです。** 複数の入力を並べる場合（ラジオグループなど）は `id` と `aria-required` を自分で指定してください
- **`Steps` のステップ番号は並び順から自動で採番されます。** `Steps.Item` に番号を渡す prop はありません。現在位置はルートの `current` で指定します
- **カードの右上に置くものは `Card.Action` に入れます。** `Card.Header` は横並びで、`Card.Action` が右端に寄ります。自分で絶対配置する必要はありません
- **`Card.Body` は横並びの flex です。** 中の要素を幅いっぱいに広げたいときは、子に `flex: 1` を与えてください。フォームや縦積みの内容を入れると、指定しない限り内容ぶんの幅で止まります
- **`Card.Title` / `Dialog.Title` の見出しレベルは `level` prop で指定します。** `role="heading"` と `aria-level` を自分で組まないでください。`Card.Title` は `level` を省くと見出しにならない `div` になります（カードが文書構造のどこに置かれるかはライブラリ側から分からないため）。`Dialog.Title` は省略時に `h2` になります

## 4. アイコン

`Icon` の `name` に、次のいずれかを渡します。**この一覧にない名前は型エラーになります。**

{{ICON_NAMES}}

```tsx
import { Icon, iconNames, type IconName } from 'zukki-design-system';

<Icon name="chevronRight" width={16} height={16} />;
```

`iconNames` は値としても export しているので、一覧の描画や実行時の検証に使えます。

サイズは `width` / `height` で指定します（`size` prop はありません）。`aria-label` を渡すと意味を持つ画像として、渡さないと装飾（`aria-hidden`）として扱われます。

## 5. 型の使い方

すべてのコンポーネントの props 型を公開しています。ラッパーを作るときに使ってください。

```tsx
import { Button, type ButtonProps } from 'zukki-design-system';

export const SubmitButton = (props: Omit<ButtonProps, 'type'>) => (
  <Button {...props} type="submit" />
);
```

選択肢を持つ prop には名前付きの union があります。`ButtonVariant` のように参照できます。

公開している型と値。

{{EXPORTED_TYPES}}

`SizeType` のような汎用的な名前の型は公開していません。サイズは `ButtonSize` / `IconButtonSize` のようにコンポーネント固有の型を使ってください。

## 6. やりがちな間違い

```tsx
❌ <Button variant="danger">削除</Button>
✅ <Button variant="failure">削除</Button>
```

```tsx
❌ <Button size="lg">送信</Button>
✅ <Button size="md">送信</Button>   {/* Button の size は sm / md のみ */}
```

```tsx
❌ <IconButton><Icon name="close" /></IconButton>
✅ <IconButton aria-label="閉じる"><Icon name="close" /></IconButton>
```

```tsx
❌ <Card.Title level={1}>タイトル</Card.Title>
✅ <Card.Title level={2}>タイトル</Card.Title>   {/* level は 2〜6 */}
```

```tsx
❌ import { Button } from 'zukki-design-system';   // CSS を読み込んでいない
✅ import { Button } from 'zukki-design-system';
   import 'zukki-design-system/styles.css';
```

```tsx
❌ <Dialog open title="確認">本文</Dialog>
✅ <Dialog open><Dialog.Header><Dialog.Title>確認</Dialog.Title></Dialog.Header>...</Dialog>
```

## 7. 配色

既定の `styles.css` はライトとダークの両対応で、CSS の `light-dark()` を使っています。OS の設定に追従し、要素の `color-scheme` で範囲を限って上書きできます。

```tsx
<div style={{ colorScheme: 'dark' }}>
  {/* この中だけダーク配色になる */}
</div>
```

配色を固定したい場合は、代わりに次のどちらかを読み込みます。両方や `styles.css` と併用しないでください。

| CSS | 配色 |
| --- | --- |
| `zukki-design-system/styles.css` | `color-scheme` に従って切り替わる（既定） |
| `zukki-design-system/styles-light.css` | ライトに固定 |
| `zukki-design-system/styles-dark.css` | ダークに固定 |

**ビルド設定に注意してください。** `styles.css` は `light-dark()` に依存しています。ビルドツールの対応ブラウザ設定が古いと `light-dark()` がポリフィルへ変換され、`prefers-color-scheme` にしか反応しなくなります（要素単位の切り替えができなくなります）。Vite なら次を指定します。

```ts
export default defineConfig({
  build: { cssTarget: 'chrome123' },
});
```

設定が難しい場合は、値が解決済みの `styles-light.css` / `styles-dark.css` を使ってください。こちらはビルド設定に左右されません。

対応ブラウザの下限は Chrome / Edge 123、Safari 17.5、Firefox 120 です。
