# zukki-design-system-react

https://github.com/zukki30/zukki-design-system の React only のデザインシステム

## インストール

npm には publish していないため、git から install する。

```bash
pnpm add github:zukki30/zukki-design-system-react
```

`react` / `react-dom` は peer dependency なので、利用側で用意する（v19 以上）。

## 使い方

**コンポーネントと合わせて CSS を必ず読み込む。** 配色や余白は CSS 変数で定義されているため、読み込まないと色も余白も当たらない。

```tsx
import { Button, Card } from 'zukki-design-system';
import 'zukki-design-system/styles.css';

export const App = () => (
  <Card>
    <Card.Header>
      <Card.Title level={2}>タイトル</Card.Title>
    </Card.Header>
    <Card.Body>本文</Card.Body>
    <Card.Footer>
      <Button variant="primary">ボタン</Button>
    </Card.Footer>
  </Card>
);
```

### 配色の選び方

3 種類の CSS を配布している。用途に応じて 1 つだけ読み込む。

| CSS | 配色 |
| --- | --- |
| `zukki-design-system/styles.css` | `color-scheme` に従ってライト / ダークが切り替わる |
| `zukki-design-system/styles-light.css` | ライトに固定 |
| `zukki-design-system/styles-dark.css` | ダークに固定 |

既定（`styles.css`）は `light-dark()` で定義されており、OS の設定に追従する。特定の範囲だけ配色を固定したい場合は `color-scheme` を指定する。

```tsx
<div style={{ colorScheme: 'dark' }}>
  {/* この中だけダーク配色になる */}
  <Card>...</Card>
</div>
```

#### 注意 1: ビルド設定で `light-dark()` を残すこと

`styles.css` は `light-dark()` に依存している。**ビルドツールの対応ブラウザ設定によっては `light-dark()` が古い形へ変換され、`color-scheme` による切り替えが効かなくなる**（OS の設定にしか反応しなくなる）。

Vite の場合は次を指定する。

```ts
export default defineConfig({
  build: {
    cssTarget: 'chrome123',
  },
});
```

この設定が難しい場合は、値が解決済みの `styles-light.css` / `styles-dark.css` を使う。こちらはビルド設定に左右されない。

#### 注意 2: `color-scheme` を上書きする位置

`styles.css` は `:root` に `color-scheme: light dark` を宣言している。同じ詳細度のセレクタで上書きする場合は、**ライブラリの CSS より後に読み込まれる必要がある**。

読み込み順に依存させたくない場合は、インラインスタイルか、より詳細度の高いセレクタを使う。

### 対応ブラウザ

各ブラウザの最新版を想定している。`light-dark()` を使っているため、下限は次のとおり。

| ブラウザ | 下限バージョン |
| --- | --- |
| Chrome / Edge | 123 |
| Safari | 17.5 |
| Firefox | 120 |

## ディレクトリ構成

```
├─ figma --- Tokens Studio for figma から export した JSON ファイル
├─ src --- コンポーネント
├─ style-dictionary/ --- style-dictionary の設定ファイル
│ ├─ build.js --- デフォルトモードの CSS ファイルを生成する設定ファイル
│ ├─ build-dark.js --- ダークモードの CSS ファイルを生成する設定ファイル
│ ├─ config.json --- style-dictionary の設定ファイル
│ └─ tokens --- Figma のトークンを style-dictionary で扱えるように変換した JSON ファイル
│
├- .cursorignore --- cursor の ignore ファイル
```

## CSS variables の生成

1. Figma で、 Tokens Studio for figma を使用し、デザインシステムのトークンを export し、このリポジトリに push する。
2. pull 後に、 `pnpm token:transform` を使用し、CSS variables を生成する。
3. 変換後に、 `pnpm build:tokens` を使用し、CSS ファイルを生成する。

## Web fonts の生成

下記 code を `head` 内に記載する。

```
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=BIZ+UDGothic:wght@400;700&family=BIZ+UDMincho:wght@400;700&family=Lato:wght@400;700&display=swap" rel="stylesheet">
```

or

```
<style>
@import url('https://fonts.googleapis.com/css2?family=BIZ+UDGothic:wght@400;700&family=BIZ+UDMincho:wght@400;700&family=Lato:wght@400;700&display=swap');
</style>
```
