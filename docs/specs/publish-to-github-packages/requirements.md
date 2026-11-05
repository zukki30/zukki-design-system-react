# 要件: GitHub Packages へ publish する

## 背景

このライブラリは現在 **git 経由で install して使う**（`README.md:7-41`）。

```bash
pnpm add github:zukki30/zukki-design-system-react
```

この形式は認証が要らない反面、利用側に次の負担をかけている。

| 負担 | 内容 |
| --- | --- |
| **ビルドが利用側で走る** | `dist/` をリポジトリに含めず `prepare` で install 時にビルドする（`AGENTS.md`「配布物」）。npm / pnpm は `prepare` を実行するために**このライブラリの devDependencies を全部 install する**。Storybook・Playwright・Vite・style-dictionary まで利用側に降ってくる |
| **ビルド許可の設定が必要** | pnpm 10 は既定で依存パッケージのビルドスクリプトを実行しないため、利用側が `onlyBuiltDependencies` に追加しないと `ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED` で install に失敗する（`README.md:11-21`） |
| **ビルド環境の差に晒される** | 利用側の Node / pnpm でビルドが走るため、ツールチェーンの差で落ちうる。`.mise.toml` で固定しているのは**このリポジトリの開発環境だけ**で、利用側には効かない |
| **バージョン指定が git 記法になる** | `#v3.0.0` / `#semver:^3.0.0` を使う。Dependabot / Renovate の追従も弱い |

[`auto-release-tag`](../auto-release-tag/requirements.md) でタグと GitHub Release の自動作成までは済んでおり、同 spec では GitHub Packages への publish を明示的にスコープ外としていた（`requirements.md:64`, `:149`）。本 spec はその続きにあたる。

publish 済みの成果物を配れば、上の 4 つはすべて消える。利用側は `dist` だけを受け取る。

## 現状

### 配布側の準備状況

| 項目 | 状態 |
| --- | --- |
| `exports` / `types` / `files` | 整っている（`package.json:10-34`）。publish 向けの形になっている |
| `peerDependencies` | `react` / `react-dom` を `^19.0.0` で宣言済み（`package.json:72-75`） |
| `dependencies` | `clsx` のみ（`package.json:69-71`） |
| 配布物の検査 | `pnpm verify:dist` がパッケージ名の self-reference で `exports` ごと検査している。**publish 経路と同じ解決経路**を見ている |
| `prepare` | `pnpm build` が入っている（`package.json:58`）。publish 時のビルドにそのまま使える |
| `private: true` | **publish をブロックしている**（`package.json:4`） |
| `repository` / `homepage` / `bugs` | **未設定** |
| `license` | `ISC`（雛形の既定値が残っている）。LICENSE ファイルは無い |
| リリース CI | `release.yml` がタグと GitHub Release を作る。publish ステップは無い |

### GitHub Packages 側の制約（回避できないもの）

いずれも GitHub Packages の仕様であり、設計で選択できる余地が無い。要件の前提として扱う。

| # | 制約 | 影響 |
| --- | --- | --- |
| C-1 | **スコープ付きの名前しか受け付けない。スコープは所有者と一致する必要がある** | `zukki-design-system` → **`@zukki30/zukki-design-system`** への改名が必須。利用側の `import` 文が変わる |
| C-2 | **公開パッケージでも install に認証が必要** | 利用側に `.npmrc`（スコープごとのレジストリ指定）と `read:packages` 権限のトークンが必要。README での案内が不可欠 |
| C-3 | **npm の provenance（`--provenance`）は npmjs 専用** | GitHub Packages では使えない。来歴の証明が要るなら Actions の attestation など別手段になる |
| C-4 | **同じバージョン番号を再利用できない** | publish のやり直しは必ずバージョンを上げる。ただしバージョンの削除自体は npmjs より柔軟（公開パッケージはダウンロード数が一定を超えると削除不可） |

### 名前の変更が波及する箇所

`zukki-design-system` という文字列を**パッケージ名として**参照している箇所。実測で洗い出した。

| ファイル | 箇所 | 内容 |
| --- | --- | --- |
| `package.json` | `name` | 改名の本体 |
| `README.md` | install / 使い方 / CSS 一覧 | 利用側向けの案内 |
| `docs/agent-guide.template.md` | `:39`, `:50`, `:56`, `:116`, `:130`, `:173-175`, `:197-199` | `dist/AGENTS.md` の生成元 |
| `scripts/probes/usage.tsx` | `:23`, `:45`, `:70-71`, `:167` | 配布物の型 probe。import 元はパッケージ名で書く規約（`AGENTS.md`「配布物」） |
| `scripts/verify-dist.ts` | `:44`, `:175`, `:267-268` | 生成する probe の import 文と `exports` 解決の検査 |

次は**バンドルの出力ファイル名**であり、パッケージ名とは別物。変更しない。

- `vite.config.ts:33` — `zukki-design-system.js` / `.cjs`
- `scripts/verify-dist.ts:37-38`, `:60-61` — 上記ファイルの検査
- `scripts/build-css-variants.ts:23` — `zukki-design-system.css`

## 方針（決定済み）

事前のやり取りで次を決定した。要件はこれを前提とする。

| 論点 | 決定 | 理由 |
| --- | --- | --- |
| 配布先 | **GitHub Packages（`https://npm.pkg.github.com`）** | npmjs への公開はしない |
| git install の経路 | **一本化する。** README から git install の案内を削除し、GitHub Packages の手順に置き換える | 手順が 2 つ並ぶと利用側が迷う。`onlyBuiltDependencies` の注意書きも不要になる |
| パッケージ名 | **`@zukki30/zukki-design-system`** | C-1 により選択の余地が無い |
| バージョン | **`4.0.0`** | 名前が変わると既存の利用側は `import` 文の書き換えが必要になるため、破壊的変更として扱う。3.x = 旧名 / 4.x = スコープ付き、と境界を明確にする |
| publish を実行する場所 | **CI のみ。** 人の手元から publish しない | トークンを個人の環境に置かない。`release.yml` が既に「検証してからタグを打つ」経路を持っているため、そこに乗せる |

`prepare` スクリプトは **publish 時のビルドに使うため残す**。git install を案内しなくなっても、`prepare` 自体は publish（`pnpm pack` / `pnpm publish`）の前処理として動く。

## 機能要件

### FR-1: `@zukki30/zukki-design-system` として publish できる状態にする

- `private: true` を外す
- `name` を `@zukki30/zukki-design-system` にする
- `publishConfig` で**レジストリを GitHub Packages に固定する**。`npmjs.com` へ誤って publish されない形にすること
- `repository` を設定する。GitHub Packages はこの値でパッケージとリポジトリを関連付ける
- `version` を `4.0.0` にする

`publishConfig.registry` をパッケージ側に持たせるのは、利用者の手元やローカルの `.npmrc` の設定に関係なく publish 先が定まるようにするため。レジストリの指定を環境側だけに置くと、環境が変わったときに publish 先が変わる。

### FR-2: 名前の変更を配布物と検査に反映する

「現状」の表に挙げた箇所をすべて新しい名前に更新する。

- `scripts/probes/usage.tsx` と `scripts/verify-dist.ts` が生成する probe の import 元を新しい名前にする。**相対パスに書き換えないこと**（`exports` を通らない検査になるため。`AGENTS.md`「配布物」）
- `docs/agent-guide.template.md` を更新し、`pnpm build:agent-guide` で `dist/AGENTS.md` を生成し直す
- `pnpm verify:dist` が新しい名前で通ること

self-reference（`name` + `exports` によって自分自身をパッケージ名で解決できる仕組み）はスコープ付きの名前でも同じく働く。probe の方式は変えない。

### FR-3: CI から自動で publish する

- `main` へのマージで、**タグ / GitHub Release の作成と同じ経路で publish される**こと
- 人手の操作を必要としないこと
- publish するのは `package.json` の `version` が未リリースのときだけ（既存の判定を踏襲する）

### FR-4: publish が冪等であること

同じバージョンが既にレジストリに存在する場合、**エラーにせず正常終了する**こと。

`release.yml` は並走しうる設計になっている（`concurrency` を sha ごとに分けている。`release.yml:19-21`）ため、同じバージョンの publish が二重に走る可能性がある。「既に publish 済み」と「権限不足などの本当の失敗」は区別し、後者は落とすこと。

### FR-5: publish に失敗したバージョンを再実行できること

現在のリリース判定は **「`v<version>` のタグが未作成か」** である（`release.yml:36-70`）。この順序のまま publish を後ろに足すと、**タグ作成に成功して publish が失敗した場合、再実行しても `should-release=false` となり、そのバージョンだけ永久に publish されない**穴ができる。

- 一時的な失敗（ネットワーク・レジストリ側の障害）から**再実行で復帰できる**こと
- 「タグはあるが publish されていない」状態を作らないこと

### FR-6: 認証に個人のトークンを使わないこと

- publish の認証は Actions の `GITHUB_TOKEN` で完結させる。PAT を Secrets に置かない
- ワークフローの `permissions` を明示し、必要なスコープだけを与える

`GITHUB_TOKEN` は実行ごとに発行され、終了時に失効する。同一リポジトリのパッケージへの publish はこれで足りる（`auto-release-tag` の NFR-1 と同じ判断）。

### FR-7: 利用側のドキュメントを更新する

利用側が参照できるのは `README.md` と `dist/AGENTS.md`、`node_modules` の `.d.ts` だけである（`AGENTS.md`「利用側に届ける情報」）。

`README.md` に次を書く。

1. **`.npmrc` の設定**（`@zukki30` スコープを GitHub Packages へ向ける）
2. **認証トークンの用意**（必要な権限、`.npmrc` への書き方）。**トークンを `.npmrc` に直書きさせない**案内にすること（環境変数を参照する形を示す）
3. install コマンドとバージョン指定（`^4.0.0` のような通常の semver 範囲が使えること）
4. GitHub Actions など CI での install 方法

あわせて次を削除する。

- git install の手順（`#v3.0.0` / `#semver:` の案内を含む）
- `onlyBuiltDependencies` の注意書き（`README.md:11-21`）。publish 済みの成果物を配るため不要になる

`dist/AGENTS.md` 側は、利用側の設定ファイルから読み込ませるパスが `@./node_modules/@zukki30/zukki-design-system/dist/AGENTS.md` に変わる点を反映する。

### FR-8: `AGENTS.md`（本リポジトリの規約）を更新する

- 「配布物」節の記述を publish 前提に改める
- 「リリース」節に publish が含まれることを書く
- 規約の唯一の正は `AGENTS.md` であるため、`CLAUDE.md` には書かない

### FR-9: Chromatic の project token を `package.json` から外す

`package.json:64` にトークンが直書きされている。

```json
"chromatic": "npx chromatic --project-token=chpt_********"
```

**`package.json` は必ず配布物の tarball に含まれる。** 現在もリポジトリが public なため新規の流出ではないが、publish するとパッケージの中身としても配られる。環境変数（`CHROMATIC_PROJECT_TOKEN`）から読む形に変える。

### FR-10: 実際に install して動くことを確認する

[`publishable-package`](../publishable-package/results.md) と同じ流儀で、**リポジトリ外の最小プロジェクトから install して確認する**こと。

| # | 確認項目 |
| --- | --- |
| 1 | `.npmrc` + トークンの手順どおりに install できる |
| 2 | `import` が解決でき、利用側の `tsc --noEmit` とビルドが通る |
| 3 | 型が効く（誤った prop 値が型エラーになる） |
| 4 | CSS が当たる |
| 5 | フックが動く（React が二重に読み込まれていない） |
| 6 | `dist/AGENTS.md` が新しいパスで読める |

## 非機能要件

### NFR-1: publish されるまで既存のリリース動作を壊さないこと

- `version` を上げない push では、タグも Release も publish も発生しないこと
- `ci.yml` の実行内容・実行時間に影響を与えないこと

### NFR-2: 何が起きたかが実行結果から読み取れること

`release.yml` は既に「スキップした理由」を実行サマリへ出している（`release.yml:61-67`, `:129-145`）。publish についても同じ粒度で、**publish したか / 既に存在してスキップしたか / 失敗したか**が読み取れること。

### NFR-3: `GITHUB_TOKEN` が他のワークフローを発火しない制約を踏まえること

`GITHUB_TOKEN` で作成したタグは他のワークフローをトリガーしない（`release.yml:112-114` にコメントがある）。「タグ作成をトリガーに publish」という構成は採れないため、**同一ジョブ内で完結させる**こと。

### NFR-4: 既存のワークフローと流儀を揃えること

- Node / pnpm のバージョン指定は `ci.yml` / `release.yml` と同じ書き方にする（`.mise.toml` から読む）
- 判断を伴う箇所には理由をコメントで残す

### NFR-5: パッケージの公開範囲を把握した状態にすること

**npm レジストリのパッケージはリポジトリの可視性を継承しない。** GitHub Packages のレジストリは「granular permissions」と「repository-scoped permissions」に分かれており、npm は前者（ユーザー / Organization のスコープ）に属する。そして個人アカウントのスコープへ初めて publish したパッケージは **既定で private** になる。

> 「When you first publish a package that is scoped to your personal account, the default visibility is private and only you can see the package」（[configuring-a-packages-access-control-and-visibility](https://docs.github.com/en/packages/learn-github-packages/configuring-a-packages-access-control-and-visibility)）

したがって**初回 publish 後に、パッケージの設定で可視性を public へ変更する作業が必要**である。この手順を公開チェックリストに明記し、変更後の可視性が意図と一致していることを確認すること。

> **2026-11-05 追記:** 当初この節は「可視性はリポジトリに従うため public になる見込み」と書いていた。PR #161 のレビュー指摘を受けて公式ドキュメントを確認し、誤りだったため書き換えた。

public であっても install には認証が必要（C-2）という非対称性を、README の案内に反映すること。

## スコープ外

- **npmjs への公開** — 行わない。将来 npmjs へ出す場合は、スコープ付きの名前をそのまま持っていける
- **provenance / attestation の付与** — C-3 により GitHub Packages では `--provenance` が使えない。Actions の attestation を使うかは別途判断する
- **旧名（`zukki-design-system`）の互換パッケージを出すこと** — 利用者が限られるため、import 文の書き換えで対応する
- **`CHANGELOG.md` の生成** — `auto-release-tag` と同じ判断で持たない
- **`version` の自動採番** — 人が上げる方針を継続する
- **過去バージョン（3.x）の遡及 publish** — 4.0.0 から始める

## 判断が必要な論点

設計フェーズで決める。

### 論点 1: publish・タグ・検証の実行順序

FR-5 の穴を塞ぐ方法。

| 案 | 内容 | 評価の観点 |
| --- | --- | --- |
| A. publish → タグ / Release | 失敗時は単に再実行で復帰できる（タグが無いので判定が通る） | publish 済みでタグが無い状態が一時的に生じる。ただし再実行で解消する |
| B. タグ / Release → publish | 既存の順序に近い | タグ作成後の失敗から復帰できない（FR-5 の穴がそのまま残る） |
| C. 判定基準を「タグとパッケージの両方が揃っているか」に変える | どちらが欠けても再実行で埋まる | 判定ロジックが増える。レジストリへの問い合わせが必要 |

### 論点 2: publish コマンドと認証の渡し方

| 案 | 内容 | 評価の観点 |
| --- | --- | --- |
| `pnpm publish` | パッケージマネージャを統一できる | CI 環境では `--no-git-checks` の要否を確認する必要がある |
| `pnpm pack` → `npm publish <tarball>` | 公開する tarball そのものを publish できる | コマンドが 2 つに分かれる |

認証用 `.npmrc` の作り方も決める。`actions/setup-node` の `registry-url` / `scope` に任せるか、ワークフローで明示的に書き出すか。**pnpm が `setup-node` の生成する設定を読むかは実機で確認する**こと。

### 論点 3: 利用側に案内するトークンの種類

GitHub のドキュメントは GitHub Packages の npm レジストリに対して classic PAT（`read:packages`）を案内している。fine-grained PAT で読めるかを実機で確認し、**README には実際に動いた手順だけを書く**。

CI（GitHub Actions）からの install は `secrets.GITHUB_TOKEN` で足りるかも併せて確認する。利用側が別リポジトリの場合、パッケージ側でのアクセス許可が必要になりうる。

### 論点 4: `license` と LICENSE ファイルを整えるか

`license: ISC` は雛形の既定値が残ったもので、LICENSE ファイルも無い。配る以上は明示したいが、本 spec に含めるか別件にするかを決める。

### 論点 5: `verify:dist` に tarball の検査を足すか

現在の `verify:dist` は `dist/` と `exports` の解決を見ている。publish するなら「tarball に何が入るか」（`files` の効き方）も検査対象になりうる。`pnpm pack` の内容を検査に足すかを決める。

## 受け入れ条件

- [ ] `main` へ `version: 4.0.0` をマージすると、タグ・GitHub Release・GitHub Packages への publish がすべて自動で行われる
- [ ] `version` を変えない push では、タグも Release も publish も発生せず、ワークフローは成功する
- [ ] 同じバージョンで再度 publish が走っても、エラーにならず理由が実行サマリに出る
- [ ] publish が失敗した場合、**再実行で復帰できる**（タグだけが残って publish されない状態にならない）
- [ ] Secrets に PAT を追加していない。`permissions` が最小になっている
- [ ] `pnpm verify:dist` が新しいパッケージ名で通る
- [ ] `dist/AGENTS.md` が新しい名前で生成されている（手編集していない）
- [ ] `README.md` の install 手順が GitHub Packages のものに置き換わり、git install と `onlyBuiltDependencies` の案内が消えている
- [ ] `README.md` の手順にトークンの直書きが無い
- [ ] `AGENTS.md` の「配布物」「リリース」節が publish 前提に更新されている
- [ ] `package.json` に Chromatic の token が残っていない
- [ ] `pnpm lint:check` / `format:check` / `typecheck` / `test` / `test:a11y` が通る
- [ ] **リポジトリ外の最小プロジェクトから install し、FR-10 の 6 項目を確認した**
- [ ] パッケージの可視性が意図と一致していることを確認した
