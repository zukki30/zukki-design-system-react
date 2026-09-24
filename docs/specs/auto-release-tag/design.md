# 設計: main へのマージで自動的にリリースタグを打つ

対応する要件: [requirements.md](./requirements.md)

## 概要

`.github/workflows/release.yml` を新規に追加する。`main` への push をトリガーに、**判定**と**リリース**の 2 ジョブに分ける。

```
main への push
  │
  ├─ ci.yml（既存・変更しない）
  │
  └─ release.yml（新規）
       │
       ├─ check ジョブ ── package.json の version を読む
       │                   v<version> タグの存在を確認する
       │                   → 既にある: ここで終了（成功）。理由をサマリに出す
       │                   → 無い   : should-release=true を出力
       │
       └─ release ジョブ（should-release が true のときだけ実行）
            ├─ pnpm install --frozen-lockfile  ← prepare でフルビルド
            ├─ pnpm verify:dist
            └─ gh release create v<version> --target <sha> --generate-notes
                 └─ タグ作成・Release 作成・ノート生成が 1 コマンドで済む
```

**ジョブを 2 つに分けるのが設計の要点である。** `main` への push の大半はリリースを伴わない。判定を checkout だけの軽いジョブに切り出すことで、リリースしないときはビルドを動かさずに終わる。

## 論点の決着

### 論点 1: タグを打つ前の検証をどこまでやるか → 案 A を採用し、案 D を運用として推奨する

**採用: 案 A（`pnpm install` + `pnpm verify:dist` のみ）**

| 案 | 判断 | 理由 |
| --- | --- | --- |
| A. ビルドと `verify:dist` のみ | **採用** | タグが指すのは「install して使えるソース」である。`prepare` でのビルドと `verify:dist` は、利用側が install したときに実際に走る処理そのものであり、検証として最も直結する |
| B. CI 相当をすべて再実行 | 不採用 | `ci.yml` と完全に重複する。特に a11y は Playwright のセットアップを伴い重い。リリースのたびに払うには割に合わない |
| C. `workflow_run` で CI 完了を待つ | 不採用 | 重複は無いが、`workflow_run` は**ワークフロー定義が default branch のものに固定される**、トリガー元の commit を自分で解決する必要がある、CI がキャンセルされた場合の分岐が要る、と癖が多い。読み解きづらい仕掛けを 1 人メンテのリポジトリに入れる利得が小さい |
| D. branch protection に委ねる | **運用として推奨（実装とは別作業）** | 根本的で、リリース以外にも効く。ただし GitHub 上のリポジトリ設定であり、ワークフローの実装では行えない |

A と D は併用できる。D を設定した後も A を残す価値はある — branch protection は「PR の CI が通ったこと」を保証するが、マージ後の main で**他の PR と組み合わさった状態**は検証されないためである。

**重複について正直に書いておく。** リリースを伴う push では、`ci.yml` の `dist` ジョブと `release.yml` の検証が同じ内容を 2 回実行する。これは意図的に許容する。`release.yml` が `ci.yml` の結果に依存しない（= 単体で正しさを保証する）ことを、重複を消すことより優先した。リリースを伴わない push では `release` ジョブ自体が動かないため、日常的なコストにはならない。

### 論点 2: タグと Release をどう作るか → `gh release create` に一本化

```bash
gh release create "$TAG" --target "$GITHUB_SHA" --title "$TAG" --generate-notes
```

- タグが存在しなければ、GitHub 側が `--target` のコミットに**軽量タグ**を作る。タグ作成のステップを別に持たなくてよい
- `--generate-notes` が前回リリース以降の PR からノートを生成する
- `gh` は `ubuntu-latest` にプリインストールされている。既存の `assign-pr-author.yml` も `gh` を使っており流儀が揃う

**`--target "$GITHUB_SHA"` を明示するのが重要である。** 省略すると default branch の HEAD にタグが打たれる。リリースジョブの実行中に別の push が入ると、**検証したコミットとタグが指すコミットがずれる**。`GITHUB_SHA` は push イベントで「push された先頭コミット」を指し、`actions/checkout` が既定で checkout するのも同じコミットなので、明示すれば検証対象とタグが必ず一致する。

注釈付きタグにはならないが、タグの意味づけは Release 側が持つため実害は無い。

### 論点 3: リリースノートのカテゴリ分け → 最小限の `.github/release.yml` を入れる

Dependabot は weekly で最大 5 + 3 件の PR を開く（`.github/dependabot.yml`）。素の自動生成だと**リリースノートが依存更新で埋まる**ため、分けておく価値がある。

ただし **人が付けるラベルに依存しない設計にする。** Dependabot は自分の PR に `dependencies` ラベルを自動で付けるため、これだけを手がかりにする。

```yaml
# .github/release.yml
changelog:
  categories:
    # ワイルドカードは後に書いたものが効かないため、Changes を先に置いたうえで
    # dependencies を除外する。こうすると「変更が上、依存更新が下」の並びにできる
    - title: Changes
      labels:
        - '*'
      exclude:
        labels:
          - dependencies
    - title: Dependencies
      labels:
        - dependencies
```

PR は**先にマッチしたカテゴリへ入る**。`'*'` を先頭に置くとすべてを吸うため、`Changes` 側で `dependencies` を除外している。人がラベルを付けなくても、すべての PR がどちらかに必ず入る。

> `.github/release.yml`（ノートの設定）と `.github/workflows/release.yml`（ワークフロー）は別物である。名前が紛らわしいので、実装時に取り違えないこと。

### 論点 4: `version` の上げ忘れ支援 → 実行サマリに出すところまで

PR の時点で「version 差分が無い」と警告する案は採らない。**version を上げなくてよい PR のほうが多い**ため、警告がほぼ常時ノイズになる。

代わりに、タグを作らなかったときに `$GITHUB_STEP_SUMMARY` へ理由を書く（FR-3）。リリースしたつもりで main にマージした後、Actions のページを見れば「version が変わっていないのでスキップした」と読める。上げ忘れてもタグが飛ぶわけではなく、次の PR で上げれば済む。

## ワークフローの実装

```yaml
name: Release

on:
  push:
    branches: [main]

# 既定を読み取りのみにし、必要なジョブでだけ書き込みを与える
permissions:
  contents: read

# リリースは途中でキャンセルしない。ci.yml とは要件が逆なので cancel-in-progress は false にする。
# main でしか動かないため group に ref は含めず、リリース処理全体を直列化する
concurrency:
  group: release
  cancel-in-progress: false

jobs:
  # package.json の version を読み、タグが未作成かを判定するだけのジョブ。
  # main への push の大半はリリースを伴わないため、重いビルドへ進む前にここで振り分ける
  check:
    name: check version
    runs-on: ubuntu-latest
    outputs:
      tag: ${{ steps.check.outputs.tag }}
      should-release: ${{ steps.check.outputs.should-release }}
    steps:
      - uses: actions/checkout@v7

      - id: check
        run: |
          # ci.yml と同じく node で読む。runner に jq 等を要求しない。
          # package.json は type: module だが、node -p の評価は CJS なので require が使える
          version="$(node -p "require('./package.json').version")"
          if [ -z "$version" ] || [ "$version" = "undefined" ]; then
            echo "::error::package.json の version を読み取れませんでした"
            exit 1
          fi

          tag="v$version"
          echo "tag=$tag" >> "$GITHUB_OUTPUT"

          # タグの存在確認に git ls-remote を使う理由:
          #   - 完全一致で判定できる（REST の /git/ref/ は前方一致で返す場合がある）
          #   - タグを fetch せずに済む（checkout は既定で depth 1・タグ無し）
          if [ -n "$(git ls-remote --tags origin "refs/tags/$tag")" ]; then
            echo "should-release=false" >> "$GITHUB_OUTPUT"
            {
              echo "### リリースをスキップしました"
              echo
              echo "タグ \`$tag\` は既に存在します。"
              echo "リリースするには \`package.json\` の \`version\` を上げてください。"
            } >> "$GITHUB_STEP_SUMMARY"
          else
            echo "should-release=true" >> "$GITHUB_OUTPUT"
          fi

  release:
    name: release
    needs: check
    if: needs.check.outputs.should-release == 'true'
    runs-on: ubuntu-latest
    permissions:
      # タグと Release の作成に必要。個人の PAT は使わない（GITHUB_TOKEN は実行ごとに失効する）
      contents: write
    steps:
      - uses: actions/checkout@v7

      # pnpm のバージョンは package.json の packageManager から解決される
      - uses: pnpm/action-setup@v6.1.0

      - uses: actions/setup-node@v7
        with:
          # setup-node は .mise.toml を読めないため直書き。.mise.toml と揃えること
          node-version: 24.14.1
          cache: pnpm

      # main は branch protection されておらず、マージ時点で CI が通っている保証が無い。
      # 壊れたコミットにタグが付くと、利用側が #v3.1.0 で固定した先が install できなくなるため、
      # タグを打つ前にここで配布物として成立することを確かめる。
      # install 時の prepare でビルドまで走る（利用側が install したときと同じ経路）
      - run: pnpm install --frozen-lockfile

      - run: pnpm verify:dist

      # タグ作成・Release 作成・ノート生成を 1 コマンドで行う。
      # タグが無ければ GitHub 側が --target のコミットに軽量タグを作る。
      #
      # --target を明示しているのは、省略すると default branch の HEAD に打たれるため。
      # 実行中に別の push が入ると、検証したコミットとタグがずれる
      #
      # なお GITHUB_TOKEN で作ったタグは他のワークフローを発火しない（無限ループ防止の仕様）。
      # 「タグ作成をトリガーに publish」のような構成にはできないので、
      # 処理を足すときはこのジョブの中へ追加すること
      - name: Create release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAG: ${{ needs.check.outputs.tag }}
        run: |
          url="$(gh release create "$TAG" \
            --target "$GITHUB_SHA" \
            --title "$TAG" \
            --generate-notes)"
          {
            echo "### リリースしました"
            echo
            echo "- タグ: \`$TAG\`"
            echo "- Release: $url"
          } >> "$GITHUB_STEP_SUMMARY"
```

### 設計上の判断と理由

| 箇所 | 判断 | 理由 |
| --- | --- | --- |
| `permissions` を workflow 直下で `contents: read` | 既定を絞る | リポジトリ設定によっては `GITHUB_TOKEN` に広い権限が付く。明示して最小にする |
| `release` ジョブだけ `contents: write` | 必要な場所にだけ与える | タグと Release の作成に必要なのはこれだけ。`packages: write` 等は与えない |
| PAT を使わない | `GITHUB_TOKEN` で完結 | 実行ごとに自動発行され終了時に失効する。期限管理も漏洩時の影響範囲も PAT より小さい |
| `cancel-in-progress: false` | `ci.yml` と逆 | 検証は通ったのにタグが作られていない、という中途半端な状態を避ける |
| `concurrency.group` に `github.sha` を含める | commit ごとに別グループ | 下の訂正を参照 |
| `--target "$GITHUB_SHA"` | 明示する | 検証したコミットとタグを一致させる（論点 2 参照） |
| `git ls-remote` でタグ確認 | API を使わない | 完全一致で判定でき、タグの fetch も不要 |
| `node -p` で version 読み取り | jq を使わない | `ci.yml` の playwright バージョン解決と同じ流儀 |
| version の空チェック | 早期に失敗させる | `undefined` から `vundefined` というタグが作られるのを防ぐ |

### 設計時の誤り（PR #128 のレビューで判明し、実装で修正）

レビューで 2 件の欠陥を指摘され、どちらも妥当だったため実装時に直した。設計の判断が誤っていた記録として残す。

**1. `concurrency.group` を定数 `release` にしてはいけない**

当初は「main でしか動かないのでリリース処理全体を直列化する」意図で定数にした。`cancel-in-progress: false` なので実行中の run は止まらず、後続は待つだけだと考えていた。

**これは誤りである。** GitHub Actions の concurrency は同じグループで **pending の run を 1 件しか保持しない**。新しい push が来ると、待機中の run は実行されないまま置き換えられる。

```
run X（3.0.0）実行中
  → push A（3.1.0）が pending
  → push B（3.2.0）が pending に入り、A を置き換える
  → X 完了後に B だけが走り、v3.2.0 を作る
  → v3.1.0 のタグは永久に作られない
```

「version チェックは冪等だから後勝ちでよい」と考えたのが取り違えだった。**冪等性は「同じバージョンを二重に作らない」ことしか保証せず、飛ばされたバージョンは救えない。** 単一メンテナでも PR を続けてマージすれば起こりうる。

`group` に `github.sha` を含め、commit ごとに別グループへ分けた。まとめられるのは同じ sha の re-run だけになり、どの push も必ず処理される。

**その結果、run は並走しうるようになった。** 直列化を捨てたぶん、同じ version の run が重なると 2 つ目の `gh release create` が「タグが既にある」で落ちる。`gh release create` の失敗時にタグの有無を見て、既にあれば冪等に成功扱いとする分岐を足した。権限不足などの本当の失敗は従来どおり落ちる。

**2. `git ls-remote` の失敗を「タグが無い」と読んではいけない**

当初の書き方には、コマンドの失敗と一致なしを区別する仕組みが無かった。

```bash
# NG: ls-remote が失敗しても空文字列になり、else（= タグが無い）へ進む
if [ -n "$(git ls-remote --tags origin "refs/tags/$tag")" ]; then
```

`$( )` を `if` の条件へ直接置くと `set -e` が効かない。通信や認証の一時障害でも「タグが無い」と判定し、**確認できていないバージョンのリリースへ進んでしまう**。

代入の成否で分け、確認できないときは fail closed で停止する形に変えた。

```bash
if ! existing="$(git ls-remote --tags origin "refs/tags/$tag")"; then
  echo "::error::タグの存在を確認できませんでした（git ls-remote が失敗）"
  exit 1
fi
```

## 導入手順（最初のリリースをどうするか）

現在 `package.json` は `version: "3.0.0"` で、**`v3.0.0` タグは存在しない**。つまりこのワークフローを main にマージした時点で、`v3.0.0` が自動的に作られる。

これは意図どおりの挙動であり、**そのまま受け入れる**方針を採る。

- 現在の main の中身がそのまま 3.0.0 なので、`v3.0.0` を今の main に打つのは意味的に正しい
- 受け入れ条件の「実際に main へマージしてタグと Release が作られることを確認した」が、この最初のマージで満たせる

**ただし 1 点だけ承知しておくこと。** `--generate-notes` は「前回のリリース以降」でノートを作るが、前回が存在しないため **`v3.0.0` のノートには全履歴の PR が並ぶ**。一度きりのことなので、長すぎると感じたら Release を後から手で編集すればよい（Release の本文は編集可能）。

これを避けたい場合の代替として、マージ前に現在の main へ手で `v3.0.0` を打っておく方法もある。その場合は最初のマージがスキップ経路になり、リリース経路の確認は次のバージョンまで持ち越しになる。

## ドキュメントの変更

### `README.md` — インストール節

タグでバージョンを固定する方法を追記する。現状の記述は最新追従の形しか示していない。

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

> **実装時に検証すること:** `#semver:^3.0.0` 形式の範囲指定が pnpm で解決できるなら、併せて README に載せる。手元で実際に install して確かめてから書く。確認できなければタグ固定の形だけを載せる。

### `AGENTS.md` — 「リリース」節を追加

規約の唯一の正は `AGENTS.md` なので、`CLAUDE.md` には書かない。「ブランチ」節の後に追加する。

```markdown
## リリース

`package.json` の `version` を上げて `main` にマージすると、`.github/workflows/release.yml` が `v<version>` のタグと GitHub Release を自動で作る。手作業は要らない。

判定しているのは「`version` が変わったか」ではなく **「`v<version>` のタグがまだ無いか」** である。初回はこの違いが表に出る（`version` 据え置きでも `v3.0.0` が作られる）ため、`AGENTS.md` にもその旨を書く。

- **バージョンは人が上げる。** 破壊的変更かどうかの判断は機械に任せられないため、コミットメッセージからの自動採番（semantic-release 等）は入れていない
- タグが既にある場合は何も作らず、理由を Actions の実行サマリに出す。上げ忘れても壊れない
- タグを打つ前に `pnpm install`（`prepare` でビルド）と `pnpm verify:dist` を実行する。`main` は branch protection されていないため、リリース側で配布物の成立を確かめている
- リリースノートは GitHub が自動生成する。分類は `.github/release.yml` で決める。`CHANGELOG.md` は持たない（二重管理になるため）
```

## 動作の一覧

| main への push | check | release | 結果 |
| --- | --- | --- | --- |
| `version` を上げた PR のマージ | `should-release=true` | 実行 | `v<version>` タグ + Release が作られる |
| `version` を変えない PR のマージ | `should-release=false` | スキップ | 何も作られない。**ワークフローは成功**し、理由がサマリに出る |
| 同じ `version` で再度 push | `should-release=false` | スキップ | 同上（冪等） |
| ビルドが壊れているコミット | `should-release=true` | **失敗** | タグも Release も作られない。ワークフローが赤くなる |
| `version` が読めない | **失敗** | — | エラーメッセージを出して停止 |
| タグの push | — | — | `branches: [main]` なので発火しない |

## 変更するファイル

| ファイル | 種別 | 内容 |
| --- | --- | --- |
| `.github/workflows/release.yml` | 新規 | 本体 |
| `.github/release.yml` | 新規 | リリースノートの分類 |
| `README.md` | 変更 | インストール節にタグ指定を追記 |
| `AGENTS.md` | 変更 | 「リリース」節を追加 |
| `docs/specs/auto-release-tag/` | 新規 | 本 spec |

`.github/workflows/ci.yml` は**変更しない**（NFR-5）。

## 要件との対応

| 要件 | 対応 |
| --- | --- |
| FR-1 タグが自動で作られる | `on: push: branches: [main]` + `gh release create` |
| FR-2 冪等であること | `check` ジョブの `git ls-remote` 判定と `if:` によるスキップ。スキップ時も成功扱い |
| FR-3 何が起きたか分かる | 両経路で `$GITHUB_STEP_SUMMARY` に出力 |
| FR-4 Release とノート | `--generate-notes` + `.github/release.yml` |
| FR-5 タグ前の検証 | `pnpm install --frozen-lockfile` + `pnpm verify:dist`（論点 1 案 A） |
| FR-6 ドキュメント | `README.md` / `AGENTS.md` |
| NFR-1 権限を最小に | workflow 直下 `contents: read`、`release` のみ `contents: write`、PAT 不使用 |
| NFR-2 `GITHUB_TOKEN` の制約 | 1 ワークフロー内で完結。制約をコメントに明記 |
| NFR-3 実行の重なり | `concurrency: { group: release, cancel-in-progress: false }` |
| NFR-4 既存と流儀を揃える | `gh` CLI、Node 直書き + コメント、`node -p` |
| NFR-5 既存を壊さない | `ci.yml` 不変更。通常の PR 作業に手順を追加しない |

## 残るリスク

| リスク | 影響 | 対応 |
| --- | --- | --- |
| `version` の上げ忘れ | リリースされない | サマリに出る。次の PR で上げれば済む（論点 4） |
| `main` が branch protection されていない | 壊れたコミットが main に入りうる | `release` ジョブの検証で、少なくともタグは付かない。根本対処は branch protection の設定（論点 1 案 D・別作業） |
| `version` を下げてしまった | 過去のタグがあればスキップされる | 既存タグ判定に守られる。新しい番号なら通るが、これは人為ミスとして許容 |
| 最初の `v3.0.0` のノートが全履歴になる | 読みにくい | 一度きり。必要なら Release を手で編集（導入手順を参照） |
