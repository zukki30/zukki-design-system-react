# リリースの手順と確認事項

初回 publish（4.0.0）は完了している。このファイルは**以降のリリースで使う手順**と、**初回に行った設定の記録**をまとめたもの。

## パッケージの状態

| 項目 | 値 |
| --- | --- |
| 名前 | `@zukki30/zukki-design-system` |
| レジストリ | GitHub Packages（`https://npm.pkg.github.com`） |
| 可視性 | **private** |
| 初回リリース | 4.0.0（2026-11-07） |

**private のままにしている。** 利用するのは所有者（`zukki30`）と、アクセスを許可したリポジトリの Actions だけという前提のため。public にする必要が出たときの手順は「公開範囲を変えるとき」に書いた。

## 毎回のリリース手順

- [ ] `package.json` の `version` を上げる
  - 破壊的変更かどうかの判断は人が行う（自動採番は入れていない）
  - **同じバージョン番号は再利用できない。** publish をやり直すときも必ず上げる
- [ ] PR を出して `main` にマージする（`main` は ruleset「protect main」で保護されているため直接 push はできない）
- [ ] 必須チェック 7 件が通ることを確認する
  - `lint:check` / `format:check` / `typecheck` / `test` / `check:css-types` / `a11y` / `dist`
- [ ] Actions の実行サマリを確認する（「publish しました」「リリースしました」が出ていること）

マージすると `.github/workflows/release.yml` が自動で次を行う。手作業は無い。

1. `pnpm install`（`prepare` でビルド）→ `pnpm verify:dist`
2. GitHub Packages へ publish
3. `v<version>` のタグと GitHub Release の作成

判定は「`v<version>` のタグがまだ無いか」で行われるため、`version` を据え置いたままマージしても何も起きない（理由は実行サマリに出る）。

## 失敗したときの対処

- publish が 403 で落ちる
  - `permissions: packages: write` の宣言、または Settings → Actions → General の Workflow permissions を確認する
  - タグは作られていないため、直して再実行すれば復帰できる
- publish が「確認できませんでした」で落ちる
  - レジストリへの問い合わせに失敗したときに、安全側へ倒して止めている
  - 再実行する
- publish は成功したがタグが作られていない
  - 再実行すると publish は冪等にスキップされ、タグと Release だけが作られる
- **「別のコミットから publish されています」で止まった**
  - 同じバージョンが別のコミットから公開済み。タグを作ると配布物とタグがずれるため、意図的に中断している
  - どちらを正とするかを決めて、`version` を上げ直す
- 間違った内容を publish した
  - **同じバージョン番号は再利用できない。** `version` を上げて publish し直す
  - 古い版はパッケージ設定から削除できる（private のうちは制限なし。public にするとダウンロード数が一定を超えた版は削除できなくなる）
- `version` を上げ忘れてマージした
  - タグが既にあるため何も起きない（実行サマリに理由が出る）
  - `version` を上げた PR を出し直す

## install する側の準備

GitHub Packages の npm レジストリは **classic PAT のみ**に対応している（fine-grained PAT は使わない）。手順は README の「インストール」が正。

- 手元での install
  - classic PAT（`read:packages` のみ）を `~/.npmrc` に置く
  - **プロジェクトの `.npmrc` には書かない**（コミットされるため）。そちらに書くのはスコープのレジストリ指定だけ
- このリポジトリの CI
  - `secrets.GITHUB_TOKEN`。設定は不要
- 別リポジトリの CI
  - **private なので、既定では他リポジトリの `GITHUB_TOKEN` から読めない**
  - パッケージのページ → Package settings → **Manage Actions access** → そのリポジトリを `Read` で追加する
  - 許可しない場合は `read:packages` の classic PAT をそのリポジトリの Secrets に置く

## 無料枠

private パッケージは storage と data transfer の枠を使う（public は無料で、枠を一切消費しない）。

| | GitHub Free（個人） | このパッケージでの目安 |
| --- | --- | --- |
| storage | 500 MB | tarball 約 73 KB ≒ 6,800 バージョン分 |
| data transfer（月） | 1 GB | 約 14,000 回の install 相当 |

**`GITHUB_TOKEN` を使った Actions からの download は data transfer に計上されない。** 実質消費するのは手元の install だけなので、この規模では枠に当たらない。

超過時は、支払い方法が未登録なら**その時点で利用がブロックされる**（登録済みなら従量課金）。

## 公開範囲を変えるとき

他の人に使ってもらう場合は public にする。

- 手順: パッケージのページ → Package settings → 最下部の「Danger Zone」→ **Change visibility** → Public
- **`npm publish --access public` では切り替わらない。** GitHub Packages の npm レジストリは granular permissions 側で、リポジトリの可視性を継承せず、npmjs の `--access` とも意味が異なる
- **public にしても install には認証が必要**（GitHub Packages の仕様）
- public にしたら、`README.md:11` の「パッケージは private で」の記述を直す

## 初回に行った設定（記録）

以降のリリースでは不要。

- [x] GitHub Actions の既定権限を確認した（ワークフローで `permissions: packages: write` を宣言しているため追加設定は不要だった）
- [x] パッケージが publish されていることを確認した（`@zukki30/zukki-design-system@4.0.0`、宛先は `https://npm.pkg.github.com`）
- [x] タグ `v4.0.0` と GitHub Release が、publish したコミット（`7466ad8`）を指していることを確認した
- [x] 可視性が意図と一致していることを確認した（private のまま）

### 繰り越し

- [ ] **パッケージがリポジトリに紐づいているかを確認する**（パッケージのページに `zukki-design-system-react` へのリンクが出ること）
  - 紐づいていない場合は `package.json` の `repository` を、GitHub のドキュメントが示す文字列形式へ変える

    ```json
    "repository": "https://github.com/zukki30/zukki-design-system-react"
    ```

  - **どちらの形式でも `verify:dist` は通る**（文字列・オブジェクト・SSH の 3 形式に対応済み）
- [ ] **README の手順どおりに install できることを確認する**

  ```bash
  # 1. プロジェクトの .npmrc
  echo "@zukki30:registry=https://npm.pkg.github.com" >> .npmrc

  # 2. ~/.npmrc にトークン（classic PAT / read:packages のみ）
  #    //npm.pkg.github.com/:_authToken=<TOKEN>

  # 3. install
  pnpm add @zukki30/zukki-design-system
  ```

- [ ] **Chromatic の project token を再発行するか決める**
  - `package.json` からは外したが、**公開リポジトリの git 履歴には残るため無効化はされていない**
  - 再発行する場合は Chromatic 側で行い、新しい値は手元の `.env`（`CHROMATIC_PROJECT_TOKEN`）に置く。CI で使うなら Secrets にも置く
