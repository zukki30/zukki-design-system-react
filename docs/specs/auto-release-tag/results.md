# 結果: main へのマージで自動的にリリースタグを打つ

要件: [`requirements.md`](./requirements.md) / 設計: [`design.md`](./design.md) / 実装計画: [`implementation-plan.md`](./implementation-plan.md)

対象 PR: [#128](https://github.com/zukki30/zukki-design-system-react/pull/128)

## できたもの

`main` への push で `.github/workflows/release.yml` が動き、`package.json` の `version` に対応するタグが未作成なら `v<version>` のタグと GitHub Release を作る。

| ファイル | 役割 |
| --- | --- |
| `.github/workflows/release.yml` | 本体。`check version` と `release` の 2 ジョブ |
| `.github/release.yml` | リリースノートの分類（Changes / Dependencies） |

## 実地の結果（#128 のマージ）

| 確認 | 結果 |
| --- | --- |
| `Release` ワークフローの起動 | 成功（run `35943047079`） |
| `check version` ジョブ | success / `should-release=true` |
| `release` ジョブ | success（`pnpm install` → `verify:dist` → Release 作成） |
| `v3.0.0` タグ | 作成された |
| タグの指すコミット | `7deb3a4` = **マージコミットそのもの**。`--target "$GITHUB_SHA"` が効いている |
| GitHub Release | 作成され `Latest` になった |
| リリースノート | 91 行。前回リリースが無いため全履歴の PR が並んだ（想定どおり） |

ノートの行数は事前にドラフトで測ったとき 86 行だったが、実際は 91 行だった。ドラフトを作ってから #128 がマージされるまでに PR が増えたぶんの差である。

## 事前検証でやったこと

`on: push: branches: [main]` のため **PR ではワークフローが一切起動しない**。構文エラーすらマージ前には出ない。そこで手元で検証できるものを洗い出して全部実行した。

| 検証 | 方法 | 結果 |
| --- | --- | --- |
| 判定ロジック | `check` ステップのシェルを切り出し、`GITHUB_OUTPUT` を一時ファイルへ向けて実行 | `tag=v3.0.0` / `should-release=true` |
| スキップ時のサマリ | 判定を「タグあり」側へ固定したバリアントで実行 | バッククォートのエスケープが効き、`$tag` が展開される |
| `version` が読めない場合 | `version` の無い `package.json` で実行 | **exit 1** で停止し、`GITHUB_OUTPUT` に何も書かれない |
| `release` ジョブの検証コマンド | `pnpm install --frozen-lockfile` + `pnpm verify:dist` | 通過 |
| リリースノートの中身 | `gh release create --draft` | ノートが生成され、**タグは作られない**ことを確認して削除 |
| ワークフローの静的検査 | `actionlint` をスクラッチパッドへ落として実行 | `release.yml` の指摘ゼロ |

`actionlint` は `run:` ブロックの shellcheck と context 式の検証まで行うため、**PR で動かせないぶんの穴を一番埋めてくれた**。`brew install` はせず、GitHub Releases からバイナリを落として使い捨てた。

## レビューで見つかった設計の誤り（#128）

Copilot のレビューで 3 件の指摘を受け、いずれも妥当だったため修正した（`5f41d74`）。**2 件は設計フェーズの判断が明確に誤っていた。**

### 1. `concurrency.group` を定数にしていた（high）

「`cancel-in-progress: false` なら後続は待つだけ」と考えたのが誤り。GitHub Actions は同じグループで **pending の run を 1 件しか保持しない**。

```
run X（3.0.0）実行中
  → push A（3.1.0）が pending
  → push B（3.2.0）が pending に入り、A を置き換える
  → X 完了後に B だけが走る → v3.1.0 のタグは永久に作られない
```

設計時に「version チェックは冪等だから後勝ちでよい」と書いたのが取り違えだった。**冪等性は「同じバージョンを二重に作らない」ことしか保証せず、飛ばされたバージョンは救えない。**

`group: release-${{ github.sha }}` に変えて commit ごとに分けた。副作用として run が並走しうるようになったため、`gh release create` が失敗したときにタグの有無を見て、既にあれば冪等に成功扱いとする分岐を足した。

### 2. `git ls-remote` の失敗を「タグが無い」と読んでいた（high）

`$( )` を `if` の条件へ直接置くと `set -e` が効かない。通信・認証の一時障害でも空文字列になり、**確認できていないバージョンのリリースへ進んでしまう**。代入の成否で分け、fail closed にした。

### 3. `AGENTS.md` の記述が初回の挙動と矛盾していた（low）

「`version` を上げずにマージした場合はタグを作らない」と書いたが、実際の規則は **「`v<version>` のタグがまだ無いか」** である。初回はこの違いが表に出る（`version` 据え置きで `v3.0.0` が作られた）。実際の規則を書くよう直した。

**教訓。** 1 と 2 はどちらも「失敗したときにどちらへ倒れるか」の設計であり、正常系だけを見ていると気づけない。手元での検証も正常系から作ってしまい、自分では見つけられなかった。

## install の実地検証で判明したこと

`v3.0.0` タグができた後、使い捨てプロジェクトを作って実際に install した。

| 形式 | 結果 |
| --- | --- |
| `#v3.0.0`（タグ固定） | 解決できる。lockfile に `7deb3a4d7e12…` が記録される |
| `#semver:^3.0.0`（範囲指定） | **解決できる。** 同じ SHA に解決された |
| `dist/` の生成 | `prepare` が走り、26 個の export が解決できた（`Card.Header` まで含む） |

`#semver:` は設計時に「実装時に検証してから書く」と保留していたが、動作したので README に載せた。

### README のインストール手順が pnpm 10 では不足していた

**これが一番大きな発見である。** 従来の README のとおりに install すると失敗する。

```
ERR_PNPM_GIT_DEP_PREPARE_NOT_ALLOWED
The git-hosted package "zukki-design-system@3.0.0" needs to execute build scripts
but is not in the "onlyBuiltDependencies" allowlist.
```

pnpm 10 は既定で依存パッケージのビルドスクリプトを実行しない。**このライブラリは `dist/` を持たず install 時の `prepare` でビルドする構成なので、許可が無いと配布物が作られず install 自体が失敗する。** 利用側の `package.json` に次が要る。

```json
{ "pnpm": { "onlyBuiltDependencies": ["zukki-design-system"] } }
```

本 spec の変更が原因ではなく **以前から存在した README の不足**だが、「README に書いた内容を実地で検証する」という手順を踏んだおかげで表に出た。README に追記した。

> pnpm のエラーは `pnpm-workspace.yaml` への記載を案内するが、`package.json` の `pnpm.onlyBuiltDependencies` でも通ることを確認した（pnpm 10.33.0）。このリポジトリ自身が後者の書き方をしているため、README も揃えた。

## 想定と違った点

| 想定 | 実際 |
| --- | --- |
| concurrency は「後勝ちで冪等だから許容」できる | **できない。** 飛ばされたバージョンのタグが永久に欠落する |
| ノートは 86 行 | 91 行（ドラフト作成後にマージされた PR のぶん） |
| README のインストール手順は正しい | pnpm 10 では `onlyBuiltDependencies` が無いと失敗する |
| `#semver:` は動くか不明 | 動いた |

## 繰り越し

- **リリースノートの分類（`.github/release.yml`）が効いているかは未確認。** `--generate-notes` は「前回リリース以降」で作るため、`v3.0.0` の直後は対象の PR が無く検証できない。**次の実リリースのノートで確認する**
- `main` の branch protection は未設定のまま。設計の論点 1 案 D にあたり、リポジトリ設定の変更なので本 spec では扱わなかった。`release` ジョブの検証があるため、壊れたコミットにタグが付くことは防げている
- 既存の `.github/workflows/codex-review.yml` に `actionlint` の指摘が 1 件ある（`permission-profile is not defined in action "openai/codex-action@v1"`）。本 spec の範囲外として触っていない
