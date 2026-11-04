# zukki-design-system-react

https://github.com/zukki30/zukki-design-system の React only のデザインシステム

公開 Storybook: https://6abdd879d77f1b3c4d923aa9-dfkbhjalgl.chromatic.com/?path=/docs/configure-your-project--docs

## インストール

[GitHub Packages](https://github.com/zukki30/zukki-design-system-react/packages) で配布している。npmjs には publish していない。

**公開パッケージだが、install には認証が必要**（GitHub Packages の仕様）。

### 1. スコープのレジストリを指定する

プロジェクトの `.npmrc` に次の 1 行を書く。**トークンはここに書かない**（このファイルはコミットされる）。

```
@zukki30:registry=https://npm.pkg.github.com
```

### 2. トークンを用意する

GitHub Packages の npm レジストリは **classic の personal access token のみ**に対応している。[Settings → Developer settings → Personal access tokens (classic)](https://github.com/settings/tokens) で `read:packages` だけを付けて作成し、`~/.npmrc` に書く（コミットされない場所に置く）。

```
//npm.pkg.github.com/:_authToken=<TOKEN>
```

### 3. install する

```bash
pnpm add @zukki30/zukki-design-system
```

バージョンは通常の semver 範囲で指定できる。

```bash
# 4.x の最新に追従する
pnpm add @zukki30/zukki-design-system@^4.0.0

# 特定のバージョンに固定する
pnpm add @zukki30/zukki-design-system@4.0.0
```

利用できるバージョンは [Releases](https://github.com/zukki30/zukki-design-system-react/releases) を参照。

`react` / `react-dom` は peer dependency なので、利用側で用意する（v19 以上）。

### CI（GitHub Actions）から install する

```yaml
- uses: actions/setup-node@v7
  with:
    node-version-file: .mise.toml
    registry-url: https://npm.pkg.github.com
    scope: '@zukki30'
- run: pnpm install --frozen-lockfile
  env:
    NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

このリポジトリ以外のワークフローから install する場合は、パッケージ側でそのリポジトリへの read を許可するか、`read:packages` の classic PAT を Secrets に置いて `NODE_AUTH_TOKEN` に渡す。

## 3.x からの移行

3.x は git（`github:zukki30/zukki-design-system-react`）から install する形で配布していた。4.0.0 で GitHub Packages へ移したため、パッケージ名が `zukki-design-system` から **`@zukki30/zukki-design-system`** に変わった（GitHub Packages はスコープ付きの名前のみ対応し、スコープは所有者と一致する必要があるため）。

**コンポーネントの API は変わっていない。** 書き換えるのは install の設定と `import` 元だけ。

### 1. 旧パッケージを外す

```bash
pnpm remove zukki-design-system
```

### 2. レジストリとトークンを設定する

上の「インストール」の手順 1・2（プロジェクトの `.npmrc` と `~/.npmrc`）を済ませる。

### 3. 新しいパッケージを入れる

```bash
pnpm add @zukki30/zukki-design-system
```

### 4. `import` 元を書き換える

```diff
-import { Button, Card } from 'zukki-design-system';
-import 'zukki-design-system/styles.css';
+import { Button, Card } from '@zukki30/zukki-design-system';
+import '@zukki30/zukki-design-system/styles.css';
```

まとめて置き換える場合（macOS の `sed`。Linux は `-i ''` を `-i` にする）。

```bash
grep -rl "zukki-design-system" src | xargs sed -i '' "s|'zukki-design-system|'@zukki30/zukki-design-system|g"
```

引用符の直後だけを対象にしているため、`'@zukki30/zukki-design-system`（スコープの `/` が直前に来る）には二重に当たらない。二重引用符で書いている場合は `'` を `\"` に替えてもう一度実行する。

### 5. 不要になった設定を消す

- **`package.json` の `pnpm.onlyBuiltDependencies` から `zukki-design-system` を外す。** publish 済みの成果物を配るようになったため、install 時のビルドは起きない。**配列ごと削除しないこと**（他のパッケージのビルドまで止まる）
- **AI エージェント向けガイドの読み込みパスを変える。** `@./node_modules/zukki-design-system/dist/AGENTS.md` → `@./node_modules/@zukki30/zukki-design-system/dist/AGENTS.md`

## 使い方

**コンポーネントと合わせて CSS を必ず読み込む。** 配色や余白は CSS 変数で定義されているため、読み込まないと色も余白も当たらない。

```tsx
import { Button, Card } from '@zukki30/zukki-design-system';
import '@zukki30/zukki-design-system/styles.css';

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

### コンポーネント

| コンポーネント | 説明 |
| --- | --- |
| `Breadcrumb` | 現在地までの階層を示すパンくずリスト |
| `Button` | ラベルを持つボタン |
| `Card` | 情報のまとまりを載せる面（合成） |
| `Checkbox` | 複数選択のチェックボックス |
| `Dialog` | モーダルダイアログ（合成） |
| `FormField` | ラベル・補助テキスト・エラーをまとめるフォームフィールド（合成） |
| `Icon` | 組み込みのアイコン |
| `IconButton` | アイコンだけのボタン |
| `Input` | 1 行のテキスト入力 |
| `InputNumber` | 数値入力 |
| `Radio` | 単一選択のラジオボタン |
| `Select` | ドロップダウンの選択 |
| `Skeleton` | 読み込み中のプレースホルダー |
| `Spinner` | 読み込み中のスピナー |
| `Steps` | 手順の進捗を示すステップ（合成） |
| `Switch` | オン / オフの切り替え |
| `Tag` | 短いラベルを示すタグ |
| `TextArea` | 複数行のテキスト入力 |
| `Tooltip` | 補足を示す吹き出し |

「合成」と書いたものは compound components で、**パーツを子として組み立てる**。`title` や `footer` に ReactNode を渡すスロット prop は持たない。

```tsx
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

props の型はすべて公開しているので、ラッパーを作るときに使える。

```tsx
import { Button, type ButtonProps } from '@zukki30/zukki-design-system';

export const SubmitButton = (props: Omit<ButtonProps, 'type'>) => (
  <Button {...props} type="submit" />
);
```

### AI エージェントで使う場合

型から読み取れないこと（CSS の import が必須であること・compound components の組み方・アイコン名の一覧・やりがちな間違い）をまとめたガイドを配布物に同梱している。**エージェントが `node_modules` を自力で探すとは限らないため、利用側の設定ファイルから読み込ませる。**

```markdown
<!-- 利用側の AGENTS.md / CLAUDE.md -->
@./node_modules/@zukki30/zukki-design-system/dist/AGENTS.md
```

ガイドは install したバージョンの実際の中身から生成されているため、ライブラリを更新すれば内容も追従する。

### 配色の選び方

3 種類の CSS を配布している。用途に応じて 1 つだけ読み込む。

| CSS | 配色 |
| --- | --- |
| `@zukki30/zukki-design-system/styles.css` | `color-scheme` に従ってライト / ダークが切り替わる |
| `@zukki30/zukki-design-system/styles-light.css` | ライトに固定 |
| `@zukki30/zukki-design-system/styles-dark.css` | ダークに固定 |

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
