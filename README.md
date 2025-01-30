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