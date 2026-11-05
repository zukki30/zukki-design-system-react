# 実装計画: GitHub Packages へ publish する

対応する設計: [`design.md`](./design.md)

ブランチ: `chore/publish-to-github-packages`（`origin/main` = `a34f4e7` から作成）

## 進め方

**改名を最初に、ドキュメントを最後に行う。** 改名は `verify:dist`（self-reference による型解決）が検知してくれるため、先に通しておけば以降の手順で壊れたときに原因を切り分けやすい。

CI のワークフローは**手元で実行できない**ため、最後にまとめて書く。代わりに、手元で検証できるところ（pack した tarball を install して使う）を厚くする。

| 手順 | 内容 | 手元で検証できるか |
| --- | --- | --- |
| 1 | パッケージのメタ情報 | ✅ |
| 2 | LICENSE | ✅ |
| 3 | 名前の波及（probe / verify-dist） | ✅ `pnpm verify:dist` |
| 4 | `verify:dist` の検査追加 | ✅ |
| 5 | エージェントガイド | ✅ `pnpm build:agent-guide` |
| 6 | Chromatic トークン | ✅（`chromatic` は実行しない。設定の形だけ） |
| 7 | README / AGENTS.md | ✅ `pnpm verify:dist`（README の一覧検査） |
| 8 | `release.yml` | ❌ publish 後に実機で確認 |
| 9 | 全体の検査 | ✅ |
| 10 | tarball からの install 検証（FR-10） | ✅ |

## 手順 1: パッケージのメタ情報

`package.json` を次のとおり変更する。

| 変更 | 値 |
| --- | --- |
| `name` | `@zukki30/zukki-design-system` |
| `private` | **削除** |
| `version` | `4.0.0` |
| `repository` | `{ "type": "git", "url": "git+https://github.com/zukki30/zukki-design-system-react.git" }` |
| `homepage` | `https://github.com/zukki30/zukki-design-system-react#readme` |
| `bugs` | `https://github.com/zukki30/zukki-design-system-react/issues` |
| `publishConfig` | `{ "registry": "https://npm.pkg.github.com" }` |
| `license` | `MIT` |

`exports` / `files` / `main` / `module` / `types` / スクリプト（`chromatic` を除く）は変更しない。

**検証:** `node -p "require('./package.json').name"` が新しい名前を返す。

## 手順 2: LICENSE

リポジトリルートに MIT の `LICENSE` を置く（`Copyright (c) 2026 zukki30`）。

**検証:** `npm pack --dry-run --json` の一覧に `LICENSE` が含まれる。

## 手順 3: 名前の波及

| ファイル | 変更 |
| --- | --- |
| `scripts/probes/usage.tsx` | `:23`, `:45`, `:70-71`, `:167` の import 元を `@zukki30/zukki-design-system` に。相対パスにはしない |
| `scripts/verify-dist.ts` | `:175` の生成 probe と `:266-268` の `exports` 解決を `package.json` の `name` から組み立てる。`:44` のコメントも新しい名前に |

`verify-dist.ts` は `package.json` を読む処理を 1 か所に持たせ、手順 4 のメタ情報の検査と共用する。

**検証:** `pnpm build && pnpm verify:dist` が通る。**ここで落ちたら self-reference が解決できていない**ので、先へ進まない。

## 手順 4: `verify:dist` の検査追加

1. `ALWAYS_PACKED`（`:140`）に `LICENSE` を加える。**これを忘れると手順 2 で既存の検査が落ちる**
2. tarball の一覧に必須ファイルが含まれるかを検査する。一覧は既存の `required`（`:36-49`）に `dist/` を前置して導き、手書きの二重管理を作らない
3. `package.json` のメタ情報を検査する（`private` が無い・`name` が `@zukki30/` で始まる・`publishConfig.registry` が GitHub Packages）

**検証:** `pnpm verify:dist` が通る。さらに**わざと壊して落ちることを確かめる**（`files` から `dist` を外す / `private: true` を戻す → それぞれ落ちる → 元に戻す）。検査が検査として機能しているかは、落ちる側を見ないと分からない。

## 手順 5: エージェントガイド

1. `docs/agent-guide.template.md` のパッケージ名（`:39`, `:50`, `:56`, `:116`, `:130`, `:173-175`, `:197-199`）を置き換える
2. 読み込みパスの案内を `@./node_modules/@zukki30/zukki-design-system/dist/AGENTS.md` にする
3. `pnpm build:agent-guide` で `dist/AGENTS.md` を生成し直す（**手編集しない**）

**検証:** `dist/AGENTS.md` に旧名が残っていない（`grep -c "from 'zukki-design-system'" dist/AGENTS.md` が 0）。

## 手順 6: Chromatic トークン

1. `package.json` の `chromatic` スクリプトを `npx chromatic` にする（トークンは `CHROMATIC_PROJECT_TOKEN` から読まれる）
2. `.gitignore` に `.env` を追加する
3. README の該当箇所があれば、トークンの渡し方を書き換える

**検証:** `grep -r "chpt_" package.json README.md` が 0 件。

> トークンそのものは既に公開リポジトリに含まれているため、**この変更では無効化されない。** 必要なら Chromatic 側で再発行する（運用判断なので実装には含めない）。

## 手順 7: ドキュメント

### `README.md`

1. インストール節（`:7-41`）を設計の文面に置き換える（`.npmrc` → トークン → install → CI）
2. 使い方の例の import 元をすべて新しい名前にする
3. AI エージェント向けの節の読み込みパスを更新する
4. git install と `onlyBuiltDependencies` の案内を削除する

### `AGENTS.md`

| 節 | 変更 |
| --- | --- |
| 配布物（`:83-85`） | 「git 経由で install」を GitHub Packages 前提に。`dist/` を含めず `prepare` でビルドする点は変わらない（publish 時に走る）ことを明記 |
| 利用側に届ける情報（`:113`） | `dist/AGENTS.md` の読み込みパス |
| リリース（`:540`） | publish → タグ → Release の順と、その順序にした理由 |

`CLAUDE.md` は触らない。

**検証:** `pnpm verify:dist`（README のコンポーネント一覧の検査が含まれる）。

## 手順 8: `release.yml`

設計の内容を反映する。

1. `release` ジョブの `permissions` に `packages: write` を足す
2. `actions/setup-node` に `registry-url` / `scope` を足す
3. `verify:dist` の後ろに publish ステップを足す（`npm view` による事前確認 → `npm pack` → `npm publish <tarball>`、409 は冪等に成功扱い、確認できないときは fail closed）
4. publish を `Create release` より**前**に置く
5. `GITHUB_TOKEN` が他のワークフローを発火しない制約のコメント（`:112-114`）を、publish を同一ジョブに置いた理由として更新する

`check` ジョブと `ci.yml` は変更しない。

**検証:** 手元では構文のみ（`actionlint` は導入していないため、YAML として読めることと `gh workflow view` での確認に留める）。動作確認は publish 後。

## 手順 9: 全体の検査

CI と同じ内容を通す。

```bash
pnpm lint:check && pnpm format:check && pnpm typecheck && pnpm test && pnpm check:css-types && pnpm verify:dist
pnpm test:a11y
```

`test:a11y` はブラウザが要るため最後に単独で回す。

## 手順 10: tarball からの install 検証（FR-10）

リポジトリ外に最小プロジェクトを作り、**pack した tarball を install して**確認する。レジストリへ publish する前に確認できるのは、名前・`exports`・型・CSS・実行時の動作まで。

```bash
npm pack --ignore-scripts --pack-destination <検証用ディレクトリ>
```

| # | 確認項目 | 方法 |
| --- | --- | --- |
| 1 | tarball を install できる | `npm i ./zukki30-zukki-design-system-4.0.0.tgz` |
| 2 | 新しい名前で import が解決できる | 利用側で `tsc --noEmit` |
| 3 | 型が効く | 誤った prop 値が型エラーになることを確認 |
| 4 | CSS が読み込める | `import '@zukki30/zukki-design-system/styles.css'` が解決でき、変数が含まれる |
| 5 | CJS / ESM の両方から export が取れる | `require()` と `import()` で export 数を数える |
| 6 | `dist/AGENTS.md` が新しいパスで読める | `node_modules/@zukki30/zukki-design-system/dist/AGENTS.md` の存在確認 |

**レジストリ側でしか確認できないものは publish 後に回す**（設計の R-1 / R-2 / R-3）。

| 確認項目 | タイミング |
| --- | --- |
| publish 先が GitHub Packages であること | 初回 publish 後 |
| パッケージがリポジトリに紐づいていること（`repository` の形式） | 初回 publish 後 |
| パッケージの可視性（NFR-5） | 初回 publish 後 |
| 別リポジトリの Actions から install できるか | 初回 publish 後 |

## 想定される手戻り

| # | 起きうること | 対処 |
| --- | --- | --- |
| 1 | `verify:dist` の self-reference が解決できない | `package.json` の `name` と probe の import 元が一致しているかを見る。`exports` は変更していないので、原因は名前のずれに限られる |
| 2 | LICENSE 追加で既存の混入検査が落ちる | 手順 4-1 を先に入れる |
| 3 | `npm pack --dry-run --json` の出力形式が想定と違う | 既存コード（`:132-137`）が同じ呼び出しを使っているため、形式はそこに合わせる |
| 4 | publish が CI で落ちる | タグは作られないため、原因を直して再実行すれば復帰できる（設計の論点 1） |

## コミットの分け方

**中間コミットで検査が落ちない分け方にする。** 当初は手順ごとに 6 つへ分ける想定だったが、次の 2 点で成立しないことが分かった。

- 改名（手順 1）と probe の import 元（手順 3）が別コミットになると、間のコミットで self-reference が解決できず `verify:dist` が落ちる
- LICENSE の追加（手順 2）と `ALWAYS_PACKED` への追加（手順 4）が別コミットになると、間のコミットで「開発用のファイルが混ざっている」と判定される

結果、**配布物に影響する変更は 1 つのコミットにまとめる**。

| # | コミット | 内容 |
| --- | --- | --- |
| 1 | `chore: publish as @zukki30/zukki-design-system 4.0.0` | 手順 1・2・3・4・5・6（`package.json` / LICENSE / `.gitignore` / probe / `verify-dist` / ガイドのテンプレート） |
| 2 | `ci: publish to GitHub Packages on release` | 手順 8 |
| 3 | `docs: describe installation from GitHub Packages` | 手順 7 + spec 一式 |

## 受け入れ条件との対応

| 受け入れ条件 | 確認する手順 |
| --- | --- |
| publish → タグ → Release が自動で行われる | 手順 8 + publish 後の実機確認 |
| `version` 据え置きでは何も起きない | `check` ジョブ（変更しない） |
| 同じバージョンで再実行しても冪等 | 手順 8（`npm view` / 409 の扱い） |
| publish 失敗から再実行で復帰できる | 手順 8（publish をタグより前に置く） |
| PAT を追加していない / `permissions` が最小 | 手順 8 |
| `verify:dist` が新しい名前で通る | 手順 3・9 |
| `dist/AGENTS.md` が生成し直されている | 手順 5 |
| README が GitHub Packages の手順に置き換わっている | 手順 7 |
| トークンの直書きが無い | 手順 6・7 |
| `AGENTS.md` が更新されている | 手順 7 |
| Chromatic トークンが `package.json` に無い | 手順 6 |
| CI 相当の検査が通る | 手順 9 |
| 最小プロジェクトからの install 検証 | 手順 10 |
| 可視性の確認 | publish 後 |
