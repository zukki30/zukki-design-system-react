# 設計: GitHub Packages へ publish する

対応する要件: [`requirements.md`](./requirements.md)

## 概要

変更は 4 つのかたまりに分かれる。

| # | かたまり | 内容 |
| --- | --- | --- |
| 1 | パッケージのメタ情報 | `private` の削除・改名・`version` 4.0.0・`repository` / `publishConfig` の追加・Chromatic トークンの外出し |
| 2 | 名前の波及 | probe（`usage.tsx` / `verify-dist.ts`）とエージェントガイドのテンプレート |
| 3 | リリース CI | `release.yml` に publish を足す。**publish → タグ / Release の順**にする |
| 4 | ドキュメント | `README.md` の install 節を置き換え、`AGENTS.md` の「配布物」「リリース」節を更新 |

既存の `check` ジョブ（`v<version>` タグの有無でリリースするか決める）はそのまま使う。publish もこの判定に従う。

## 公式ドキュメントで確認した事実

設計の前提。いずれも [GitHub Packages の npm レジストリのドキュメント](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)の記載である。

| # | 事実 | 設計への影響 |
| --- | --- | --- |
| F-1 | スコープ付きの名前のみ対応。スコープは所有者と一致する（`@NAMESPACE/PACKAGE-NAME`） | 名前は `@zukki30/zukki-design-system` に確定 |
| F-2 | **「GitHub Packages only supports authentication using a personal access token (classic)」** | 利用側に案内するのは classic PAT（`read:packages`）。fine-grained PAT は案内しない |
| F-3 | Actions からは `GITHUB_TOKEN` で自身のリポジトリのパッケージを publish できる | PAT を Secrets に置かない（FR-6） |
| F-4 | `.npmrc` は `@NAMESPACE:registry=https://npm.pkg.github.com` と `//npm.pkg.github.com/:_authToken=TOKEN` の 2 行 | README の手順と CI の設定がこれに従う |
| F-5 | **「You need an access token to publish, install, and delete private, internal, and public packages」** | public でも認証が必要。README で明記する |
| F-6 | リポジトリとの関連付けは `package.json` の `repository` で行う | `repository` を必須の変更に含める |
| F-7 | `publishConfig.registry` に `https://npm.pkg.github.com` を置く形が案内されている | 同じ形を採る |

## 論点の決着

### 論点 1: publish・タグ・検証の実行順序 → 案 A（publish → タグ / Release）

```
check（タグの有無で判定）
  └─ release ジョブ
       1. install（prepare でビルド）
       2. pnpm verify:dist
       3. publish  ← 追加
       4. gh release create（タグ + Release）
```

**判定基準がタグの有無であるため、タグは一番最後に作る。** タグが「このバージョンのリリースは完了した」という印になり、途中で落ちたときは必ず再実行で復帰できる。

| 落ちた箇所 | 残る状態 | 再実行の結果 |
| --- | --- | --- |
| 検証 | 何も無い | 再度検証から走る |
| publish | 何も無い | 再度 publish を試す |
| タグ / Release | **publish 済みだがタグが無い** | publish は冪等にスキップ（論点 2）、タグと Release が作られる |

案 B（タグを先に作る）はこの最後の行が成立しない。タグがある＝`should-release=false` となり、そのバージョンだけ永久に publish されない。案 C（タグとパッケージの両方を見る）は判定が増えるうえ、案 A で同じ保証が得られるので採らない。

### 論点 2: publish コマンドと認証の渡し方 → `npm pack` → `npm publish <tarball>`、`.npmrc` は `actions/setup-node` に作らせる

**認証**は `actions/setup-node` の `registry-url` / `scope` に任せる。これは F-4 の 2 行を runner 上の設定ファイルへ書き出し、トークンを `NODE_AUTH_TOKEN` 環境変数から読む形にしてくれるもので、**GitHub 自身が案内している経路**である。ワークフローの中でトークンをファイルへ書き込む手順を自前で持たずに済む。

**publish コマンド**は npm を使う。`pnpm publish` ではなく npm にする理由は 2 つ。

1. **`setup-node` が作る設定を pnpm が読むかに不確実性がある。** npm は自身の設定ファイルなので確実に読む
2. **`pnpm publish` は既定で git の状態を検査する**（作業ツリーがクリーン・publish ブランチにいる・リモートと同期している）。CI では既に `check` ジョブで対象コミットが確定しており、この検査は意味を持たないどころか `--no-git-checks` の付け忘れで落ちる要因になる

パッケージマネージャは pnpm に統一しているが、**publish は「レジストリとの通信」であって依存解決ではない**ため、ここだけ npm を使っても依存ツリーには影響しない。この理由はワークフローにコメントとして残す。

tarball を一度作ってから publish するのは、**publish するものと検査するものを同一にする**ため（論点 5 と対応する）。`--ignore-scripts` を付けるのは、直前の `pnpm install` で `prepare` が走って `dist` が揃っているため、pack 時の再ビルドが無駄になるから。

### 論点 3: 利用側に案内するトークンの種類 → classic PAT（`read:packages`）のみ

F-2 のとおり、GitHub Packages の npm レジストリは classic PAT のみ対応と明記されている。**fine-grained PAT は README に書かない。**

トークンの置き場所は 2 段に分ける。

| ファイル | 内容 | コミット |
| --- | --- | --- |
| プロジェクトの `.npmrc` | `@zukki30:registry=https://npm.pkg.github.com` | **する**（秘密情報なし） |
| `~/.npmrc` | `//npm.pkg.github.com/:_authToken=<TOKEN>` | しない（ホームディレクトリ） |

スコープのレジストリ指定はチームで共有したいがトークンは共有してはいけないため、**同じ `.npmrc` という仕組みでも置き場所を分ける**。これなら「トークンを `.npmrc` に直書きさせない」（FR-7）を手順として自然に満たせる。

CI からの install は `secrets.GITHUB_TOKEN` + `setup-node` を案内する。ただし**別リポジトリから install する場合はパッケージ側でアクセス許可が必要になりうる**ため、そのときは `read:packages` の classic PAT を Secrets に置く、という代替も併記する（実機確認の対象）。

### 論点 4: `license` と LICENSE ファイル → 本 spec に含め、MIT にする

配る以上は明示が要る。`ISC` は雛形の既定値が残ったもので、**意図して選んだ値ではない**。LICENSE ファイルが無い状態も「ライセンス不明」と読まれる。

- `package.json` の `license` を `MIT` にする
- リポジトリルートに `LICENSE` を置く（`Copyright (c) 2026 zukki30`）
- `files` に LICENSE を足す必要はない（npm / pnpm が自動で tarball に含める）

MIT を推すのは、デザインシステムの利用（コードの改変・再配布・社内利用）を妨げず、追加の義務が「著作権表示の保持」だけで済む最も一般的な選択だから。**ここは法的な意思表示なので、実装前に確認する。**

### 論点 5: `verify:dist` に tarball の検査を足すか → 不足分だけ足す

**tarball の検査は既にある。** `scripts/verify-dist.ts:131-153` が `npm pack --dry-run --json` でファイル一覧を取り、`dist/` と `README.md` / `package.json` 以外が混ざっていないかを見ている。

足りないのは次の 2 点で、これだけを追加する。

| # | 追加する検査 | 理由 |
| --- | --- | --- |
| 1 | 配布に必要なファイルが**一覧に含まれる**こと | 現在の検査は「混ざっていないか」だけを見ており、逆方向（`files` を触って**生成されているのに配られない**）は通ってしまう。`dist/` の存在チェック（`:36-53`）は tarball を見ていないため、ここは別の検査になる |
| 2 | publish できる形のメタ情報であること（`private` が無い・`name` がスコープ付き・`publishConfig.registry` が GitHub Packages を指す） | `private: true` の復活や `publishConfig` の消失は、**ビルドを壊さないまま publish 先を変えてしまう**（`AGENTS.md`「配布物」に並ぶ 4 項目と同じ性質） |

**あわせて既存の検査を直す必要がある。** `ALWAYS_PACKED`（`:140`）が `README.md` と `package.json` だけなので、LICENSE を置くと「開発用のファイルが混ざっている」と判定されて落ちる。npm / pnpm は LICENSE を `files` の指定によらず必ず含めるため、`ALWAYS_PACKED` に加える。

## パッケージのメタ情報

```diff
 {
-  "name": "zukki-design-system",
+  "name": "@zukki30/zukki-design-system",
   "type": "module",
-  "private": true,
-  "version": "3.0.1",
+  "version": "4.0.0",
   "description": "デザインシステム",
+  "repository": {
+    "type": "git",
+    "url": "git+https://github.com/zukki30/zukki-design-system-react.git"
+  },
+  "homepage": "https://github.com/zukki30/zukki-design-system-react#readme",
+  "bugs": "https://github.com/zukki30/zukki-design-system-react/issues",
+  "publishConfig": {
+    "registry": "https://npm.pkg.github.com"
+  },
   "main": "./dist/zukki-design-system.cjs",
   …
-  "license": "ISC",
+  "license": "MIT",
   …
-    "chromatic": "npx chromatic --project-token=chpt_********"
+    "chromatic": "npx chromatic"
 }
```

- **`exports` / `files` / `main` / `module` / `types` は変更しない。** 既に publish 向けの形になっている
- **バンドルの出力ファイル名（`zukki-design-system.js` / `.cjs` / `.css`）は変更しない。** パッケージ名とは別物であり、`exports` から参照されているだけなので改名の必要がない。変えると `vite.config.ts` と `verify-dist.ts`、`build-css-variants.ts` に無意味な差分が出る
- `publishConfig.registry` を**パッケージ側に置く**のは、手元や CI の設定に関係なく publish 先を定めるため。npmjs へ誤って publish されない防御にもなる
- `--access` は指定しない。npm レジストリのパッケージは **granular permissions** の対象で、**個人アカウントのスコープへの初回 publish は既定で private**（リポジトリの可視性を継承しない）。public にするのはパッケージ設定での操作であり、npmjs の `--access` では切り替わらない。初回 publish 後の手順として [`release-checklist.md`](./release-checklist.md) に書く

Chromatic は `CHROMATIC_PROJECT_TOKEN` を読む（`chromatic` CLI が標準で参照する環境変数）。手元では `.env` に置き、CI で使う場合は Secrets から渡す。`.env` は `.gitignore` に無いため**追加する**。

## リリース CI

`release.yml` の `release` ジョブに手を入れる。`check` ジョブは変更しない。

```yaml
  release:
    name: release
    needs: check
    if: needs.check.outputs.should-release == 'true'
    runs-on: ubuntu-latest
    permissions:
      # タグと Release の作成に必要。個人の PAT は使わない
      contents: write
      # GitHub Packages への publish に必要
      packages: write
    steps:
      - uses: actions/checkout@v7

      - uses: pnpm/action-setup@v6.1.0

      - uses: actions/setup-node@v7
        with:
          node-version-file: .mise.toml
          cache: pnpm
          # GitHub Packages 用の .npmrc を runner 上に作らせる。
          # scope を渡すと「@zukki30 はこのレジストリ」「認証は NODE_AUTH_TOKEN から」
          # の 2 行が書き出される。トークンをワークフローでファイルへ書く手順を持たずに済む
          registry-url: https://npm.pkg.github.com
          scope: '@zukki30'

      - run: pnpm install --frozen-lockfile

      - run: pnpm verify:dist

      # publish はタグより先に行う。check ジョブの判定基準が「タグの有無」なので、
      # タグが最後の印になっていないと、publish だけ失敗した状態から再実行で復帰できない
      #
      # pnpm ではなく npm を使う理由:
      #   - .npmrc は setup-node が npm のために書き出したもので、npm が確実に読む
      #   - pnpm publish は既定で git の状態を検査する。対象コミットは check ジョブで
      #     確定済みなので無意味な検査であり、--no-git-checks の付け忘れで落ちる要因になる
      # publish はレジストリとの通信であって依存解決ではないため、依存ツリーには影響しない
      - name: Publish to GitHub Packages
        env:
          NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          name="$(node -p "require('./package.json').name")"
          version="$(node -p "require('./package.json').version")"

          # 既に publish 済みかを調べる。並走した run が同じバージョンを publish している
          # 場合と、前回タグ作成だけが失敗した場合に、ここで冪等にスキップする。
          #
          # 「無かった」と「確認できなかった」は必ず分ける。認証切れや一時障害を
          # 「無い」と読むと publish を試みて失敗するだけだが、原因が分からなくなる。
          # check ジョブの ls-remote と同じく fail closed にする
          set +e
          view="$(npm view "$name@$version" version 2>&1)"
          status=$?
          set -e

          if [ "$status" -eq 0 ]; then
            {
              echo "### publish をスキップしました"
              echo
              echo "\`$name@$version\` は既に公開済みです。"
            } >> "$GITHUB_STEP_SUMMARY"
            exit 0
          fi

          if ! printf '%s' "$view" | grep -q 'E404'; then
            echo "::error::publish 済みかを確認できませんでした"
            printf '%s\n' "$view"
            exit 1
          fi

          # publish するものと検査したものを同一にするため、tarball を作ってから publish する。
          # --ignore-scripts は直前の install で prepare が走り dist が揃っているため
          file="$(npm pack --ignore-scripts --pack-destination "$RUNNER_TEMP" --silent | tail -n 1)"

          if ! npm publish "$RUNNER_TEMP/$file" 2>"$RUNNER_TEMP/publish.log"; then
            # 並走した run が一瞬先に publish した場合。バージョンは上書きできないため
            # 競合は「既に publish 済み」と同義であり、冪等に成功扱いとする
            if grep -qE 'E409|EPUBLISHCONFLICT|cannot publish over' "$RUNNER_TEMP/publish.log"; then
              {
                echo "### publish 済みでした"
                echo
                echo "\`$name@$version\` は並走した実行が公開済みのため、何もしませんでした。"
              } >> "$GITHUB_STEP_SUMMARY"
              exit 0
            fi
            echo "::error::publish に失敗しました"
            cat "$RUNNER_TEMP/publish.log"
            exit 1
          fi

          {
            echo "### publish しました"
            echo
            echo "- パッケージ: \`$name@$version\`"
          } >> "$GITHUB_STEP_SUMMARY"

      - name: Create release
        # 既存のステップ。変更しない（publish の後ろに移す）
```

`GITHUB_TOKEN` が他のワークフローを発火しない制約（NFR-3）は、**publish を同じジョブ内に置く**ことで回避している。既存のコメント（`release.yml:112-114`）がこの構成を想定した書き方になっているため、内容を更新して残す。

## 名前の波及

### probe（`scripts/probes/usage.tsx`）

import 元の文字列を `@zukki30/zukki-design-system` に置き換える。**相対パスにはしない**（`exports` を通らない検査になるため。`AGENTS.md`「配布物」）。

### `scripts/verify-dist.ts`

生成する probe の import 文に書いていた名前を、**`package.json` の `name` から読む**ようにする。

```ts
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
…
`import type {\n${propsTypes.map((t) => `  ${t},`).join('\n')}\n} from '${pkg.name}';`,
```

名前を 2 か所に書かないためである。`usage.tsx` 側は静的な import 文である必要があるため直書きのままだが、**名前がずれれば self-reference が解決できず typecheck が落ちる**ので、黙って古い名前が残ることはない。

`AGENTS.md` の `exports` 解決の検査（`:267-268`）も同じく `pkg.name` を使う。

### `docs/agent-guide.template.md`

`zukki-design-system` を `@zukki30/zukki-design-system` に置き換え、`pnpm build:agent-guide` で `dist/AGENTS.md` を生成し直す（**生成物は手編集しない**）。

利用側の設定ファイルから読み込ませるパスも変わる。

```markdown
@./node_modules/@zukki30/zukki-design-system/dist/AGENTS.md
```

## `verify:dist` への追加

既存の tarball 検査（`:131-153`）の周辺に手を入れる。`npm pack --dry-run --json` の結果（`paths`）はそのまま使い回す。

```ts
// 既存: 混ざっていないかを見る。LICENSE は npm が files の指定によらず必ず含める
const ALWAYS_PACKED = ['README.md', 'LICENSE', 'package.json'];

// 追加 1: 配られるべきものが一覧にあるか。
// dist/ の存在チェックは tarball を見ていないため、files を触って
// 「生成されているのに配られない」状態になるとそちらでは気づけない
const requiredInTarball = ['package.json', 'README.md', 'LICENSE', ...required.map((f) => `dist/${f}`)];

// 追加 2: publish できる形のメタ情報か。
// private の復活や publishConfig の消失は、ビルドを壊さないまま publish 先を変える
```

| 検査 | 内容 |
| --- | --- |
| 必須ファイル | `package.json` / `README.md` / `LICENSE` と、既存の `required` 配列（エントリポイント・`main.d.ts`・CSS 3 種とその `.d.ts`・`AGENTS.md`）に `dist/` を前置したもの |
| メタ情報 | `private` が無い・`name` が `@zukki30/` で始まる・`publishConfig.registry` が `https://npm.pkg.github.com` |

必須ファイルの一覧を既存の `required` から導くのは、ファイルを増やしたときに**片方だけ古くなるのを防ぐ**ため（`AGENTS.md` の「手書きの一覧を足すと、そこだけが古くなる」と同じ理由）。

## ドキュメントの変更

### `README.md` — インストール節を置き換える

git install の案内（`:9-41`）と `onlyBuiltDependencies` の注意書き（`:11-21`）を削除し、次に置き換える。

````markdown
## インストール

GitHub Packages で配布している。**公開パッケージだが、install には認証が必要**（GitHub Packages の仕様）。

### 1. スコープのレジストリを指定する

プロジェクトの `.npmrc` に次の 1 行を書く。**トークンは書かない**（このファイルはコミットされる）。

```
@zukki30:registry=https://npm.pkg.github.com
```

### 2. トークンを用意する

GitHub Packages の npm レジストリは **classic の personal access token のみ**に対応している。`read:packages` だけを付けて作成し、`~/.npmrc` に書く（コミットされない場所に置く）。

```
//npm.pkg.github.com/:_authToken=<TOKEN>
```

### 3. install する

```bash
pnpm add @zukki30/zukki-design-system
```

バージョンは通常の semver 範囲で指定できる。

```bash
pnpm add @zukki30/zukki-design-system@^4.0.0
```

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

同じリポジトリ以外のワークフローから install する場合は、パッケージ側でそのリポジトリへの read を許可するか、`read:packages` の classic PAT を Secrets に置く。
````

使い方の例に出てくる import 元もすべて `@zukki30/zukki-design-system` に置き換える（`:48-49`, `:106`, `:130-132` ほか）。

### `AGENTS.md`

| 節 | 変更 |
| --- | --- |
| 配布物 | 「git 経由で install して使われる」を GitHub Packages 前提に改める。`dist/` をリポジトリに含めず `prepare` でビルドする点は**変わらない**（publish 時に走る）ことを明記する |
| 配布物 → 利用側に届ける情報 | `dist/AGENTS.md` の読み込みパスを更新する |
| リリース | `version` を上げて main にマージすると、**publish → タグ → Release** の順に実行されることを書く。判定が「タグの有無」である理由と、publish を先に置く理由を残す |

`CLAUDE.md` は触らない（規約の唯一の正は `AGENTS.md`）。

## 動作の一覧

| 状況 | publish | タグ / Release | ジョブ |
| --- | --- | --- | --- |
| `version` が未リリース | する | 作る | 成功 |
| `version` 据え置きで push | しない | 作らない | 成功（`check` でスキップ、理由をサマリに出す） |
| `verify:dist` が落ちた | しない | 作らない | 失敗 |
| publish が落ちた | 失敗 | 作らない | 失敗（再実行で復帰できる） |
| 既に publish 済み（**同じコミットから**）でタグが無い | スキップ | 作る | 成功 |
| 既に publish 済み（**別のコミットから**） | スキップ | **作らない** | 失敗（人が判断する） |
| 同じバージョンの run が並走した | 後続は待機し、タグの再確認で何もしない | 作らない | 成功 |
| 直列化の外から先に publish された | スキップ（409 を冪等に扱う。公開元のコミットは照合する） | 作る | 成功 |
| publish 済みかを確認できない | しない | 作らない | 失敗（fail closed） |

## 変更するファイル

| ファイル | 変更 |
| --- | --- |
| `package.json` | 改名・`private` 削除・`version` 4.0.0・`repository` / `homepage` / `bugs` / `publishConfig` 追加・`license` MIT・Chromatic トークン外出し |
| `LICENSE` | 新規（MIT） |
| `.gitignore` | `.env` を追加 |
| `.github/workflows/release.yml` | `permissions` に `packages: write`・`setup-node` にレジストリ設定・publish ステップ追加・同一バージョンの直列化とタグの再確認・コメント更新 |
| `scripts/probes/usage.tsx` | import 元を新しい名前に |
| `scripts/verify-dist.ts` | `pkg.name` 参照・`ALWAYS_PACKED` に LICENSE・tarball の必須ファイルとメタ情報の検査を追加 |
| `docs/agent-guide.template.md` | パッケージ名・読み込みパス |
| `dist/AGENTS.md` | 生成物（`pnpm build:agent-guide`） |
| `README.md` | install 節の置き換え・import 例の更新 |
| `AGENTS.md` | 「配布物」「リリース」節 |

## 要件との対応

| 要件 | 設計箇所 |
| --- | --- |
| FR-1 publish できる状態 | 「パッケージのメタ情報」 |
| FR-2 名前の波及 | 「名前の波及」 |
| FR-3 CI から自動 publish | 「リリース CI」 |
| FR-4 冪等性 | publish ステップの `npm view` による事前確認と 409 の扱い・ジョブ先頭でのタグの再確認 |
| FR-5 再実行で復帰 | 論点 1（publish → タグの順）・`gitHead` による公開元コミットの照合 |
| FR-6 PAT を使わない | `GITHUB_TOKEN` + `permissions: packages: write` |
| FR-7 利用側ドキュメント | 「`README.md` — インストール節を置き換える」 |
| FR-8 `AGENTS.md` | 「`AGENTS.md`」 |
| FR-9 Chromatic トークン | 「パッケージのメタ情報」 |
| FR-10 実地検証 | 実装計画フェーズで手順に落とす |
| NFR-1 既存動作を壊さない | `check` ジョブ・`ci.yml` は変更しない |
| NFR-2 実行結果から読み取れる | 各分岐で `$GITHUB_STEP_SUMMARY` に出力 |
| NFR-3 `GITHUB_TOKEN` の制約 | publish を同一ジョブ内に置く |
| NFR-4 流儀を揃える | `node-version-file` / fail closed / 理由コメント |
| NFR-5 可視性の把握 | publish 後に Public へ変更する（既定は private。`release-checklist.md`） |

## レビューで判明した設計の不足（PR #161）

実装後のレビューで 3 件の指摘を受け、いずれも実装で修正した。設計の記録としてここに残す。

### 1. 同じバージョンの run が並走すると、配布物とタグが別のコミットを指す

同じ `version` のまま `main` へ連続してマージすると、`check` ジョブの判定（タグの有無）を**両方の run が通過**しうる。その結果、

1. run A（コミット A）が publish する
2. run B（コミット B）は publish を冪等にスキップする
3. run B が `--target $GITHUB_SHA`（= コミット B）にタグと Release を作る

となり、**配布物は A の内容なのにタグは B を指す**。論点 1 で「publish を先にする」と決めた判断自体は変わらないが、**同一バージョンの直列化が欠けていた**。

対処は 2 段にした。

- **`release` ジョブに `concurrency: release-<タグ>` を付けて、同じバージョンの run を直列化する。** group にバージョンを含めるのは、「待機中の run は 1 件しか保持されない」制約の影響を同一バージョンに閉じるため（ワークフロー単位で直列化すると、auto-release-tag で避けた「途中のバージョンだけ消える」事故に戻る）
- **待機のあとでタグを取り直す。** `check` の判定はキュー投入前のものなので、ジョブの先頭で `git ls-remote` をやり直し、既にタグがあれば以降のステップを飛ばす（重いビルドの前に判定する）

これで並走の経路は閉じるが、**非並走でも起きる経路**が残る。「A が publish → A のタグ作成だけ失敗 → 別コミット B が同じ version で流れてくる」場合である。そこで公開元のコミットを照合できるようにした。

- publish の直前に `package.json` の `gitHead` へ `$GITHUB_SHA` を書き込む。**npm は `gitHead` を自動では付けない**（ディレクトリ publish・tarball publish のどちらでも付かないことを実測で確認した）
- 既に公開済みのバージョンに出会ったら `npm view <pkg>@<version> gitHead` と `$GITHUB_SHA` を比べ、**違うコミットならタグを作らずに中断する**。同じコミットなら「タグ作成だけ失敗した実行の再開」なので続行する（FR-5 の復帰性は保たれる）

### 2. 文字列形式の `repository` にすると `verify:dist` が落ちる

`verify-dist.ts` が `repository.url` だけを読んでいたため、R-1 の復旧手順（オブジェクト形式 → 文字列形式への変更）を実行すると `owner` が `undefined` になり、**ドキュメント化した手順が検査とリリース CI を壊す**状態だった。

文字列形式・オブジェクト形式・SSH 形式のいずれからも所有者を読めるようにし、`repository` 自体が無い場合だけ落ちることを実機で確認した。

### 3. npm レジストリのパッケージはリポジトリの可視性を継承しない

**「リポジトリが public なのでパッケージも public になる見込み」という前提が誤りだった。** GitHub Packages のレジストリは granular permissions と repository-scoped permissions に分かれており、npm は前者（ユーザー / Organization のスコープ）である。個人アカウントのスコープへの初回 publish は**既定で private** で、public にするにはパッケージ設定の Danger Zone で変更する必要がある。`npm publish --access public` では切り替わらない。

要件の NFR-5 と公開チェックリストを書き換え、**初回 publish 後の必須作業**として明記した。

## 残るリスク

| # | リスク | 対処 |
| --- | --- | --- |
| R-1 | **`repository` の形式でリポジトリに紐づかない可能性。** ドキュメントは文字列形式（`https://github.com/OWNER/REPOSITORY`）を示しているが、ここでは npm 標準のオブジェクト形式を採る | publish 後にパッケージがリポジトリに紐づいているかを確認し、紐づかなければ文字列形式に変える。**どちらの形式でも `verify:dist` が通ることは確認済み**（上記 2） |
| R-2 | **tarball を渡す `npm publish` が `publishConfig.registry` を読まない可能性** | `setup-node` が書き出すスコープのレジストリ指定でも同じ宛先になるため、二重に担保されている。publish 先が GitHub Packages であることを実機で確認する |
| R-3 | **別リポジトリの Actions から `secrets.GITHUB_TOKEN` で install できない可能性** | 実機で確認し、必要ならパッケージ側のアクセス許可か classic PAT を README に案内する（論点 3 で代替を併記済み） |
| R-4 | **既存の 3.x 利用者は `import` 文の書き換えが必要** | 破壊的変更として 4.0.0 にした。Release ノートに移行手順を書く |
| R-5 | **`private: true` を外すため、手元から誤って publish できる余地が生まれる** | `publishConfig.registry` で宛先が GitHub Packages に固定され、認証が無ければ失敗する。バージョンは上書きできないため影響も限定される |
| R-6 | **`npm view` / `npm publish` のエラー文字列に依存した分岐** | `E404` / `E409` は npm のエラーコードであり文言より安定している。合致しない場合は fail closed に倒れるため、誤って「publish 済み」と判断する方向には壊れない |
