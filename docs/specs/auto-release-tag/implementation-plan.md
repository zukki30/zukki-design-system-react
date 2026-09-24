# 実装計画: main へのマージで自動的にリリースタグを打つ

要件: [`requirements.md`](./requirements.md) / 設計: [`design.md`](./design.md)

## 進め方

ブランチは `chore/auto-release-tag` を `main`（`2040996`）から作成する。

ライブラリのソース（`src/`）には一切触らない。変更は `.github/` とドキュメントだけである。

### このタスク特有の制約 — PR ではワークフローが走らない

`release.yml` のトリガーは `on: push: branches: [main]` である。つまり **PR ブランチへ push してもこのワークフローは一切起動しない。構文エラーすらマージ前には表面化しない。**

これは GitHub Actions の仕様であり、回避しようとすると（トリガーを一時的に作業ブランチへ向けるなど）**作業ブランチのコミットにタグを打ってしまう危険**のほうが大きい。したがって次の方針を採る。

1. **手元で検証できるものは全部検証する** — シェルスクリプトの挙動、`release` ジョブが実行するコマンド、リリースノートの中身
2. **残りはマージ後に実地で確認する** — タグとリリースは `gh release delete --cleanup-tag` で消せる**回復可能な操作**であり、最悪ケースも「タグが付かない」だけで利用側への実害が無い
3. **2 回のマージで両方の経路を確認する**（後述）

### 2 回のマージで両方の経路を確認する

現在 `version` は `3.0.0` で `v3.0.0` タグは存在しない（実測で確認済み）。この性質をそのまま検証に使う。

| | マージする内容 | `version` | check の判定 | 確認できること |
| --- | --- | --- | --- | --- |
| 1 回目 | 本 PR（ワークフロー + ドキュメント） | `3.0.0` | `should-release=true` | **リリース経路**（FR-1 / FR-4 / FR-5） |
| 2 回目 | follow-up PR（`results.md`） | `3.0.0` のまま | `should-release=false` | **スキップ経路**（FR-2 / FR-3） |

スキップ経路は「既存タグがある」状態でしか確かめられず、タグが 1 つも無い今は手元で再現できない。1 回目のマージで `v3.0.0` が生まれた後なら自然に通るため、`results.md` を別 PR に分けてその確認に充てる。**記録を後から書くという手順が、そのまま 2 経路目の検証になる。**

---

## ステップ 1: ワークフローとリリースノート設定を追加する

| ファイル | 変更 |
| --- | --- |
| `.github/workflows/release.yml` | **新規** |
| `.github/release.yml` | **新規** |

### 1-1. `.github/release.yml`

設計の内容をそのまま置く。**`.github/workflows/release.yml` とは別のファイルである**（名前が紛らわしいので置き場所を取り違えないこと）。

```yaml
# GitHub Release の「リリースノートを自動生成」の分類設定。
# .github/workflows/release.yml（ワークフロー本体）とは別物なので混同しないこと
changelog:
  categories:
    # PR は先にマッチしたカテゴリへ入る。'*' を先頭に置くとすべてを吸ってしまうため、
    # Changes 側で dependencies を除外して「変更が上・依存更新が下」の並びにする
    - title: Changes
      labels:
        - '*'
      exclude:
        labels:
          - dependencies
    # Dependabot は自分の PR に dependencies ラベルを自動で付ける。
    # 人がラベルを付ける運用には依存しない
    - title: Dependencies
      labels:
        - dependencies
```

### 1-2. `.github/workflows/release.yml`

設計の「ワークフローの実装」をそのまま置く。コメントも設計に書いたものを残す。

**実装時に注意する点が 1 つある。** `$GITHUB_STEP_SUMMARY` へ書く行にバッククォートを含めるとき、ダブルクォート内ではコマンド置換になるため **`\`` でエスケープする**。

```bash
echo "タグ \`$tag\` は既に存在します。"   # OK
echo "タグ `$tag` は既に存在します。"     # NG: $tag をコマンドとして実行してしまう
```

`ci.yml` と重複する箇所（`actions/checkout@v7` / `pnpm/action-setup@v6.1.0` / `node-version: 24.14.1`）は**同じ値・同じコメント**にする。Dependabot の `github-actions` グループが両方まとめて更新する。

### 1-3. 手元での検証

**(a) `check` ジョブのシェルを実際に走らせる**

スクラッチに切り出し、`GITHUB_OUTPUT` / `GITHUB_STEP_SUMMARY` を一時ファイルへ向けて実行する。

```bash
export GITHUB_OUTPUT=/tmp/out GITHUB_STEP_SUMMARY=/tmp/summary
: > "$GITHUB_OUTPUT"; : > "$GITHUB_STEP_SUMMARY"
# release.yml の check ステップの中身をそのまま貼って実行
cat "$GITHUB_OUTPUT" "$GITHUB_STEP_SUMMARY"
```

| 確認 | 期待 |
| --- | --- |
| `tag=v3.0.0` が出る | `version` の読み取りとタグ名の組み立てが正しい |
| `should-release=true` が出る | `v3.0.0` が未作成であることを正しく判定できている |
| サマリが空 | リリースする側では余計な出力をしない |

続けて `tag` を一時的に存在しない別名（`vXXX`）に変えても `should-release=true` になること、`version` の読み取りを空にすると**エラーで停止する**ことを確認する。後者は `vundefined` というタグが作られるのを防ぐガードなので、**通ることより落ちることを確かめる**。

> **手元の Node について.** この環境では `NODE_OPTIONS` に存在しないファイルの preload が入っており、素の `node -p` が失敗する。`env -u NODE_OPTIONS node -p …` で確認すること。runner では起きない事象なので、ワークフロー側の対処は不要。

**(b) スキップ経路は手元で再現できない**

`git ls-remote` はリモートを見るため、ローカルタグを作っても再現にならない。リモートへ検証用タグを push するのは、消し忘れると利用側から見える状態になるため行わない。**2 回目のマージで確認する**（「進め方」参照）。

**(c) `release` ジョブが実行するコマンドを走らせる**

```bash
pnpm install --frozen-lockfile
pnpm verify:dist
```

これは `release` ジョブの検証ステップそのものである。手元で通ることを確かめておけば、マージ後に落ちる可能性は runner 固有の問題に絞られる。

**(d) リリースノートの中身をドラフトで先に見る**

`--draft` を付けると **Release は下書きとして作られ、タグは作られない**。`v3.0.0` のノートがどうなるかを、タグを打つ前に確認できる。

```bash
gh release create v3.0.0 --draft --target "$(git rev-parse origin/main)" \
  --title v3.0.0 --generate-notes
```

確認したら必ず消す。

```bash
gh release delete v3.0.0 --yes
```

前回のリリースが存在しないため、**全履歴の PR が並ぶはず**である（設計「導入手順」で想定済み）。ここで実物を見て、そのまま受け入れるか、マージ後に本文を手で編集するかを決める。

> **分類は効かない見込み.** `.github/release.yml` は default branch のものが読まれるため、マージ前のドラフトでは `Changes` / `Dependencies` の分類が反映されない可能性が高い。ここで確認するのは**ノートが生成されること**までとし、分類の確認はマージ後（ステップ 4）に回す。

**(e) YAML の構文（任意）**

PR では release.yml が起動しないため、構文エラーはマージ後まで出ない。気になる場合は `actionlint` を一時的に入れて静的に検査する。

```bash
brew install actionlint && actionlint
```

必須にはしない。構文エラーが起きても結果は「タグが付かない」だけで、直して main へ入れ直せば回復する。

**コミット:** `ci: add release workflow that tags on merge to main`

---

## ステップ 2: ドキュメントを更新する

| ファイル | 変更 |
| --- | --- |
| `README.md` | インストール節にタグ指定を追記 |
| `AGENTS.md` | 「リリース」節を追加（「ブランチ」節の後） |

### 2-1. `README.md`

設計の内容を置く。ただし **`#semver:^3.0.0` 形式は今回書かない。**

タグでの固定（`#v3.0.0`）は git の committish 指定そのものなので確実に動くが、`#semver:` 形式が pnpm で解決できるかは**実際に install して確かめるまで断定しない**。そして確かめるには `v3.0.0` タグが必要で、それはマージ後にしか存在しない。

したがって今回は次だけを書き、検証はステップ 4 で行う。

```markdown
## インストール

npm には publish していないため、git から install する。

```bash
pnpm add github:zukki30/zukki-design-system-react
```

上の形式は **main の最新**を指す。バージョンを固定するときはリリースタグを付ける。

```bash
pnpm add github:zukki30/zukki-design-system-react#v3.0.0
```

利用できるバージョンは [Releases](https://github.com/zukki30/zukki-design-system-react/releases) を参照。

`react` / `react-dom` は peer dependency なので、利用側で用意する（v19 以上）。
```

### 2-2. `AGENTS.md`

設計の内容を「ブランチ」節の後に追加する。規約の唯一の正は `AGENTS.md` なので、`CLAUDE.md` は**変更しない**。

### 2-3. 確認

```bash
pnpm format:check
```

`README.md` / `AGENTS.md` は prettier の対象外（`{src,scripts,style-dictionary}/**/*.{ts,tsx}` のみ）なので差分は出ないはずだが、念のため通す。`lint:check` / `typecheck` / `test` は TypeScript を触っていないため状態が変わらない。

**コミット:** `docs: document the release flow`

---

## ステップ 3: PR を出してマージする

### 3-1. 変更していないことの確認

```bash
git diff main --stat
```

| ファイル | 期待 |
| --- | --- |
| `.github/workflows/ci.yml` | 差分に出ないこと（NFR-5） |
| `package.json` | 差分に出ないこと。**`version` は `3.0.0` のまま上げない** |
| `src/**` | 差分に出ないこと |
| `CLAUDE.md` | 差分に出ないこと |

`version` を上げないのは意図的である。ライブラリの中身は変わっていないため 3.0.0 のままが正しく、その結果としてマージ時に `v3.0.0` が作られる（設計「導入手順」）。

### 3-2. PR

- タイトル: `ci: tag releases automatically on merge to main`
- 本文に書くこと
  - `package.json` の `version` を上げて main にマージするとタグと Release が自動で作られること
  - **この PR をマージした時点で `v3.0.0` が作られること**、そのノートが前回リリース不在のため全履歴になること
  - 利用側はタグでバージョンを固定できるようになること
  - ライブラリの公開 API に変更は無く、トークンの再生成も破壊的変更も無いこと

見た目の変更は無いのでスクリーンショットは不要。

### 3-3. マージ直後に確認する（リリース経路 / 1 回目）

マージしたら Actions タブを開く。

| 確認 | 期待 |
| --- | --- |
| `Release` ワークフローが起動している | 構文が正しく、トリガーが効いている |
| `check version` ジョブが成功 | `should-release=true` |
| `release` ジョブが実行され成功 | ビルドと `verify:dist` が runner でも通る |
| `v3.0.0` タグが作られている | FR-1 |
| Release が作られ、ノートが入っている | FR-4 |
| タグが**マージコミットを指している** | `--target "$GITHUB_SHA"` が効いている |
| 実行サマリにタグ名と Release の URL が出ている | FR-3 |

**うまくいかなかった場合の戻し方**

```bash
# タグごと Release を消す
gh release delete v3.0.0 --cleanup-tag --yes
```

直してから `chore/auto-release-tag-fix` のようなブランチで入れ直す。タグは回復可能なので、慌てて main へ直接 push しない。

---

## ステップ 4: マージ後の検証と記録（follow-up PR）

ブランチ `docs/auto-release-tag-results` を main から作成する。

### 4-1. 実際に install して確かめる

`v3.0.0` タグができたので、README に書いた内容と `#semver:` 形式を実地で検証する。スクラッチに使い捨てのプロジェクトを作って行う。

```bash
# タグ固定（README に書いた形）
pnpm add github:zukki30/zukki-design-system-react#v3.0.0

# 範囲指定（README に書くかを判断するために確かめる）
pnpm add github:zukki30/zukki-design-system-react#semver:^3.0.0
```

| 確認 | 判断 |
| --- | --- |
| タグ固定が解決でき、`node_modules` に `dist/` が生成される | README の記述が正しいことの裏取り |
| `#semver:` が解決できる | できれば README に追記する。**できなければ追記しない** |

`prepare` でのビルドが利用側で走ることもここで確認できる（`dist/` が生成されていること）。

### 4-2. リリースノートの分類を確認する

`.github/release.yml` が default branch に入った状態になったので、分類が効くかを確かめる。ドラフトで試して消す。

```bash
gh release create v0.0.0-check --draft --generate-notes --title check
gh release delete v0.0.0-check --yes
```

`Changes` / `Dependencies` に分かれていれば設定が効いている。効いていなければ `results.md` に事実として残す（Dependabot の PR がまだ無い期間は分類が見えないだけの可能性もある）。

### 4-3. `results.md` を書く

他の spec と同じく結果を残す。特に書くこと。

- 手元で検証できた範囲と、マージ後にしか確認できなかった範囲の切り分け
- `v3.0.0` のリリースノートが実際どうなったか
- `#semver:` 形式の可否（4-1 の結果）
- リリースノートの分類が効いたか（4-2 の結果）
- 設計時の想定と違った点

### 4-4. マージして確認する（スキップ経路 / 2 回目）

この PR は `version` を `3.0.0` のまま変えない。マージ後、Actions タブで次を確認する。

| 確認 | 期待 |
| --- | --- |
| `Release` ワークフローが起動する | — |
| `check version` ジョブが**成功**する | FR-2: スキップ時もエラーにしない |
| `release` ジョブが**スキップ**される | `if:` が効いている |
| サマリに「タグ `v3.0.0` は既に存在します」と理由が出る | FR-3 |
| 新しいタグも Release も作られていない | 冪等性 |

**この確認をもって受け入れ条件がすべて埋まる。** 結果は `results.md` に追記する（必要なら 3 回目の小さなコミットになる）。

---

## 受け入れ条件との対応

| 受け入れ条件 | いつ確認するか |
| --- | --- |
| `version` を上げるとタグが作られる | ステップ 3-3（`v3.0.0` の作成で確認） |
| Release とリリースノートが作られる | ステップ 3-3 |
| `version` を変えない push でタグが作られず、成功する | **ステップ 4-4** |
| スキップの理由が読み取れる | **ステップ 4-4** |
| 壊れたコミットにタグが付かない | ステップ 1-3(c) で検証コマンドが機能することを確認。実地の失敗は起こさない |
| `permissions` が最小 | ステップ 1-2（コードレビュー） |
| PAT を追加していない | ステップ 1-2（Secrets を触らないこと） |
| README にタグ固定の方法がある | ステップ 2-1 |
| AGENTS.md にリリース手順がある | ステップ 2-2 |
| `ci.yml` の挙動が変わっていない | ステップ 3-1 |

「壊れたコミットにタグが付かない」だけは、実地で壊すわけにいかないため**コマンドが機能することの確認に留める**。わざと壊して確かめる手もあるが、main を一時的に壊すことになるため行わない。

---

## 想定される詰まりどころ

| 箇所 | 起きうること | 対処 |
| --- | --- | --- |
| PR でワークフローが走らない | 構文エラーがマージ後まで出ない | 想定内。`actionlint`（任意）で減らし、最終的には 3-3 で確認。失敗しても `gh release delete --cleanup-tag` で戻せる |
| `$GITHUB_STEP_SUMMARY` の出力 | バッククォートがコマンド置換になる | ダブルクォート内では `\`` でエスケープする（1-2 参照） |
| `gh release create` の権限 | `HTTP 403` で失敗 | `release` ジョブの `permissions: contents: write` が抜けていないか確認する |
| タグの指す先 | マージコミットでないコミットにタグが付く | `--target "$GITHUB_SHA"` が入っているか確認する |
| `pnpm install --frozen-lockfile` | lockfile と `package.json` の不整合で失敗 | 手元で 1-3(c) を通しておけば事前に分かる |
| `#semver:` の可否 | pnpm が解決できない | README に書かない。`results.md` に事実として残す（2-1 の方針） |
| ドラフト Release の消し忘れ | 下書きが残る | 1-3(d) と 4-2 の `gh release delete` を必ず実行する |
| `v3.0.0` のノートが長大 | 読みにくい | 一度きり。Release の本文は後から編集できる |

---

## コミットの一覧

| # | メッセージ | ステップ |
| --- | --- | --- |
| 1 | `ci: add release workflow that tags on merge to main` | 1 |
| 2 | `docs: document the release flow` | 2 |
| 3 | `docs: record auto release tag results` | 4（follow-up PR） |
