# zukki-design-system-react

https://github.com/zukki30/zukki-design-system の React only のデザインシステム

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
2. pull 後に、 `npm run token:transform` を使用し、CSS variables を生成する。
3. 変換後に、 `npm run build:tokens` を使用し、CSS ファイルを生成する。

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
