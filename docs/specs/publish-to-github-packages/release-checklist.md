# 公開するために必要な対応

`chore/publish-to-github-packages` ブランチの実装は完了している。ここから先は**人の操作と GitHub 側の設定**が必要な作業をまとめる。

## 1. 実装側で済んでいること（追加の作業は不要）

- パッケージ名 `@zukki30/zukki-design-system` / `version` 4.0.0
- `private` の削除と `repository` / `homepage` / `bugs` / `publishConfig` の追加
- ライセンス（MIT + `LICENSE`）
- `release.yml` への publish 追加（publish → タグ → Release の順）
- `verify:dist` の検査追加（名前のスコープ・tarball の必須ファイル・publish 可能なメタ情報）
- README の install 手順と「3.x からの移行」
- `AGENTS.md` の「配布物」「リリース」節
- Chromatic トークンの環境変数化
- 検証がすべて通過していること
  - CI 相当の検査（lint / format / typecheck / test / css-types / dist / a11y）
  - tarball からの install 検証（6 項目）

**手元から `npm publish` を実行する必要はない。** publish は `main` へのマージで CI が行う。

## 2. マージ前にやること

- [ ] ブランチを push して PR を作る（`main` は ruleset「protect main」で保護されており、直接 push はできない）

  ```bash
  git push -u origin chore/publish-to-github-packages
  gh pr create --base main --title "chore: publish as @zukki30/zukki-design-system 4.0.0" --body "<本文>"
  ```

- [ ] 必須チェック 7 件が通ることを確認する
  - `lint:check`
  - `format:check`
  - `typecheck`
  - `test`
  - `check:css-types`
  - `a11y`
  - `dist`
- [ ] GitHub Actions の既定権限を確認する（Settings → Actions → General → Workflow permissions）
  - ワークフローで `permissions: packages: write` を宣言しているため、通常は追加設定は要らない（宣言した権限が既定より優先される）
  - **publish が 403 で落ちた場合はここを見る**
- [ ] Chromatic の project token を再発行するか決める
  - `package.json` からは外したが、**公開リポジトリの git 履歴には残るため無効化はされていない**
  - 再発行する場合は Chromatic 側で行う
  - 新しい値は手元の `.env`（`CHROMATIC_PROJECT_TOKEN`）に置く。CI で使うなら Secrets にも置く

## 3. マージして publish する

- [ ] PR を `main` にマージする
- [ ] Actions の実行サマリを確認する（「publish しました」「リリースしました」が出ていること）

マージすると `.github/workflows/release.yml` が自動で次を行う。手作業は無い。

1. `pnpm install`（`prepare` でビルド）→ `pnpm verify:dist`
2. GitHub Packages へ publish（`@zukki30/zukki-design-system@4.0.0`）
3. タグ `v4.0.0` と GitHub Release の作成

## 4. publish 後に確認すること

実装では確認できず、レジストリ側でしか分からない項目。

- [ ] パッケージが publish されている
  - リポジトリの Packages、または https://github.com/zukki30?tab=packages
- [ ] パッケージがリポジトリに紐づいている（パッケージのページに `zukki-design-system-react` へのリンクが出ること）
  - 紐づいていない場合は `package.json` の `repository` を、GitHub のドキュメントが示す文字列形式へ変える

    ```json
    "repository": "https://github.com/zukki30/zukki-design-system-react"
    ```

- [ ] **パッケージを Public に変更する（初回 publish 後に必ず必要）**
  - npm レジストリのパッケージは**リポジトリの可視性を継承しない**。個人アカウントのスコープへの初回 publish は**既定で private** で、この状態では自分以外は install できない
  - 手順: パッケージのページ → Package settings → 最下部の「Danger Zone」→ **Change visibility** → Public
  - `npm publish --access public` では切り替わらない（GitHub Packages では npmjs の `--access` と意味が異なる）
  - **Public にしても install には認証が必要**（GitHub Packages の仕様）。README の案内はこれを前提にしている
- [ ] 変更後の可視性が意図と一致している
- [ ] 実際に install できる（自分のプロジェクトで README の手順をそのまま実行する）

  ```bash
  # 1. プロジェクトの .npmrc
  echo "@zukki30:registry=https://npm.pkg.github.com" >> .npmrc

  # 2. ~/.npmrc にトークン（classic PAT / read:packages のみ）
  #    //npm.pkg.github.com/:_authToken=<TOKEN>

  # 3. install
  pnpm add @zukki30/zukki-design-system
  ```

- [ ] 別リポジトリの Actions から install できるか（必要な場合のみ）
  - `secrets.GITHUB_TOKEN` で読めなければ、パッケージの設定でそのリポジトリへの read を許可する
  - または `read:packages` の classic PAT をそのリポジトリの Secrets に置く

## 5. トークンの用意（利用する側の準備）

GitHub Packages の npm レジストリは **classic PAT のみ**に対応している（fine-grained PAT は使わない）。

- 手元での install
  - classic PAT（`read:packages` のみ）
  - `~/.npmrc` に置く。**プロジェクトの `.npmrc` には書かない**（コミットされるため）
- 同じリポジトリの CI
  - `secrets.GITHUB_TOKEN`
  - 設定は不要
- 別リポジトリの CI
  - `secrets.GITHUB_TOKEN`、または classic PAT
  - そのリポジトリの Secrets に置く

## 6. 失敗したときの対処

- publish が 403 で落ちる
  - `permissions: packages: write` の宣言、または Settings → Actions → General の Workflow permissions を確認する
  - タグは作られていないため、直して再実行すれば復帰できる
- publish が「確認できませんでした」で落ちる
  - レジストリへの問い合わせに失敗したときに、安全側へ倒して止めている
  - 再実行する
- publish は成功したがタグが作られていない
  - 再実行すると publish は冪等にスキップされ、タグと Release だけが作られる
- 間違った内容を publish した
  - **同じバージョン番号は再利用できない。** `version` を上げて publish し直す
  - 古い版はパッケージ設定から削除できるが、public でダウンロード数が一定を超えると削除できなくなる
- `version` を上げ忘れてマージした
  - タグが既にあるため何も起きない（実行サマリに理由が出る）
  - `version` を上げた PR を出し直す

## 7. 公開後の運用

- リリースしたいときに `package.json` の `version` を上げて `main` にマージする
  - 判定は「`v<version>` のタグがまだ無いか」で行われる
- 破壊的変更の判断は人が行う（自動採番は入れていない）
- 3.x を git install している利用側には、README の「3.x からの移行」を案内する
- `dist/` はリポジトリに含めない。配布物は publish のときにビルドされる
