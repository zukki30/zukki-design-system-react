# 実装計画: a11y エラーを検出できる環境の構築

対象要件: [`requirements.md`](./requirements.md) / 対象設計: [`design.md`](./design.md)

## 前提

- 作業ブランチ: `chore/setup-a11y-testing`（`origin/main` = `25ac89d` から作成済み）
- 各フェーズの末尾に**検証ゲート**を置く。ゲートを通過してから次のフェーズへ進む
- フェーズ単位でコミットする。コミットメッセージは英語・プレフィックス付き（`CLAUDE.md` の規約）

## フェーズ構成の考え方

フェーズ 1 は他と独立して完結するため最初に片付ける。フェーズ 3 は設計の前提（C-3）が覆ると案 B への切り替えが必要になる**最大のリスク箇所**なので、重い作業（ルール較正・違反修正）に着手する前に判定する。

```
1. 静的解析層        … 独立・低リスク。ここだけで FR-1 が完了する
2. ブラウザ実行の疎通  … a11y 検査なしでストーリーが動くことまで
3. 配色解決と C-3 判定 … ★リスクゲート。案 A の前提を確定させる
4. ルール較正と違反切り分け
5. CI
6. ドキュメントと後始末
```

---

## フェーズ 1: 静的解析層（FR-1）

### 1-1. `eslint.config.js` に jsx-a11y の推奨ルールを追加

`plugins` への登録は既存のままにし、`rules` に `eslintPluginJsxA11y.flatConfigs.recommended.rules` を展開する。

- 展開位置は `...reactHooks.configs.recommended.rules` の直後
- **`...eslintPluginJsxA11y.flatConfigs.recommended` をそのまま展開しないこと**（plugin 再定義エラーになる）
- なぜ `rules` だけを取り込むのかをコメントで残す

### 1-2. `src/components/Dialog/Dialog.tsx` の誤検知を抑制

191 行目の `<dialog>` に対し、理由コメント付きの `eslint-disable-next-line` を追加する（設計の変更 9 のコード例のとおり）。既存の `{...props}` に関するコメントは残す。

### 1-3. `src/components/Card/Card.stories.tsx` の `href="#"` を修正

14 行目の `href` を実在するパス（`href="/"` など）に差し替える。ストーリーの表示内容は変えない。

### 検証ゲート 1

```bash
pnpm lint:check   # 0 件で終了すること
pnpm format:check
pnpm typecheck
pnpm test         # 既存 33 spec が全て成功すること
```

**確認事項:** ルールが実際に効いていること。一時的に `src` 内のどこかへ `<img src="x" />`（`alt` 欠落）を書いてエラーになることを確かめ、確認後に必ず削除する。

### コミット 1

```
chore: enable jsx-a11y recommended rules in ESLint
```

---

## フェーズ 2: ブラウザ実行の疎通（FR-2 の土台 / NFR-1）

この段階では **a11y 検査はまだ有効化しない**。ストーリーがブラウザ上でテストとして実行できることだけを確認する。

### 2-1. 依存の追加

```bash
pnpm add -D @storybook/addon-a11y@10.5.10 @storybook/addon-vitest@10.5.10 \
            @vitest/browser@4.1.11 @vitest/browser-playwright@4.1.11 playwright
```

- `vitest@4.1.11` / `storybook@10.5.10` が既存のまま維持されることを `pnpm ls` で確認する
- peer 警告が出ないことを確認する

### 2-2. ブラウザバイナリの取得

```bash
pnpm exec playwright install chromium
```

Chromium のみ。他ブラウザは入れない（NFR-2）。

### 2-3. `.storybook/main.ts` にアドオンを追加

`addons` に `'@storybook/addon-a11y'` と `'@storybook/addon-vitest'` を追加する。

### 2-4. `vitest.config.ts` を新規作成

設計の変更 5 のとおり 3 プロジェクト（`unit` / `a11y-light` / `a11y-dark`）を定義する。

### 2-5. `vite.config.ts` から `test` ブロックを削除

`configDefaults` の import が不要になるので併せて削除する。`plugins` / `resolve` / `build` は維持する。

### 2-6. `package.json` のスクリプトを更新

設計の変更 7 のとおり、既存 4 つに `--project unit` を付け、`test:a11y` を追加する。

### 検証ゲート 2

```bash
pnpm test            # ★C-5: 従来どおり 33 spec が成功すること
pnpm typecheck
pnpm test:a11y       # ストーリーがブラウザで実行されること
```

**確認事項 C-1:** `extends: './vite.config.ts'` で vanilla-extract / react プラグインが各プロジェクトへ引き継がれているか。引き継がれていない場合、`.css.ts` の解決エラーやスタイル未適用として現れる。その場合は各プロジェクトに `plugins` を明示する。

この時点でストーリー実行自体が失敗する場合（描画エラー等）は、a11y 以前の問題として先に解消する。

### コミット 2

```
chore: run Storybook stories as browser tests with Vitest
```

---

## フェーズ 3: 配色解決と C-3 の判定 ★リスクゲート

設計の D-3（案 A）の前提が成立するかをここで確定させる。

### 3-1. `.storybook/style.css` に `:root` を追加

設計の変更 4 のとおり、`:root { color-scheme: light dark; }` を**ファイル先頭**に追加する。詳細度が同じため、記述順で後続のクラスが優先される点をコメントに残す。

### 3-2. 前提の検証（一時的な確認用テスト）

`.storybook/` 配下に一時的な確認用ストーリーを置き、`a11y-light` / `a11y-dark` の両プロジェクトで以下を出力させる。

- `document.documentElement.className` — `light-theme` / `dark-theme` が付いていないこと（= `preview-head.html` が適用されていないこと）
- `getComputedStyle(document.documentElement).colorScheme` — `light dark` であること
- 任意のコンポーネントの実際の描画色（`getComputedStyle(el).color`）が、**2 プロジェクトで異なる値になること**

最後の項目が案 A 成立の決定的な証拠になる。

### 3-3. 判定と分岐

| 結果 | 対応 |
| --- | --- |
| 2 プロジェクトで色が変わる | **案 A 成立。** 確認用ストーリーを削除して 3-4 へ進む |
| `light-theme` クラスが付いており色が変わらない | `preview-head.html` が適用されている（C-3 が覆った）。**案 B へ切り替える**。設計ファイルの D-3 を更新し、`globalTypes` + decorator + `initialGlobals` の構成に変更したうえでユーザーに再確認を取る |

### 3-4. 確認用ストーリーの削除

検証専用のため必ず削除する。

### 検証ゲート 3

上記 3-2 の 3 項目が期待どおりであること。**案 B へ切り替える場合はここで一度ユーザーに設計変更を確認する。**

### コミット 3

```
chore: resolve light-dark() colors in browser test environment
```

---

## フェーズ 4: ルール較正と違反の切り分け（C-2 / C-4 / D-4 / D-5）

### 4-1. `todo` モードで全違反を洗い出す

`.storybook/preview.tsx` に a11y パラメータを追加する。**まず `test: 'todo'` で開始する**（設計 D-5）。この時点では `config.rules` の無効化はまだ入れない。

```bash
pnpm test:a11y > /tmp/a11y-baseline.txt 2>&1
```

違反を「ルール ID × 発生ストーリー数」で集計する。

### 4-2. ストーリー起因ノイズの判定（C-2）

集計結果を以下の基準で仕分ける。

| 分類 | 判断基準 | 対応 |
| --- | --- | --- |
| ストーリーの性質上の必然 | 単一コンポーネントを隔離描画する限り必ず違反する | `config.rules` で無効化。理由をコメントに残す |
| ストーリーの組み方の問題 | ストーリー側を直せば消える | **ストーリーを修正する**（ルールは無効化しない） |
| コンポーネントの欠陥 | 実装の問題 | 4-4 で仕分ける |

- `region` / `page-has-heading-one` は前者として無効化する（設計で決定済み）
- **`heading-order` は無効化しない。** `<h4>` 区切りのストーリー（`Button.stories.tsx` など）で発生した場合はストーリー側の見出しを修正する
- 上記 2 つ以外を無効化する場合は、同じ基準で判断し理由をコメントに残したうえでユーザーに報告する

### 4-3. `color-contrast` が実際に評価されていることの確認（C-4）

意図的にコントラスト不足の一時ストーリー（例: 白背景に `#eeeeee` のテキスト）を作り、**`a11y-light` / `a11y-dark` の両方で** `color-contrast` 違反として検出されることを確認する。確認後に削除する。

これが検出されない場合、配色が解決できていないかルールが無効になっているため、フェーズ 3 まで戻る。

### 4-4. 残った違反の仕分け（D-5）

| 分類 | 対応 |
| --- | --- |
| 軽微かつ修正方針が明確 | 本対応で修正する |
| デザイン判断・破壊的変更を伴う | 当該ストーリーに `parameters: { a11y: { test: 'todo' } }` を指定し、別 Issue を起票して追跡する |

**件数と内容をユーザーに報告し、修正するものと繰り延べるものの線引きを確認する。** 繰り延べ分が多い場合はスコープの再確認が必要になる。

### 4-5. 既定値を `test: 'error'` に切り替える

preview の既定値を `'error'` にする。ストーリー単位の `todo` 指定はそのまま残る。

### 検証ゲート 4

```bash
pnpm test:a11y   # 0 件で終了すること
pnpm test        # 33 spec が引き続き成功すること
pnpm lint:check
pnpm format:check
pnpm typecheck
```

### コミット 4

```
feat: fail story tests on accessibility violations
```

違反修正を伴う場合は `fix:` のコミットを分ける。

---

## フェーズ 5: CI（FR-3 / NFR-2）

### 5-1. `.github/workflows/ci.yml` に `a11y` ジョブを追加

設計の変更 8 のとおり。既存の `check` マトリクスは変更しない。

- Playwright のバージョンをキーにした `~/.cache/ms-playwright` のキャッシュ
- `pnpm exec playwright install --with-deps chromium`（Chromium のみ）
- `pnpm test:a11y`

### 5-2. `.github/dependabot.yml` の `build-test` グループに `playwright` を追加

`vitest` / `@vitest/*` は既に同グループに含まれているため、`@vitest/browser` と `@vitest/browser-playwright` は自動的にカバーされる。`@storybook/*` も `storybook` グループでカバー済み。**追加が必要なのは `playwright` のみ。**

これにより `@vitest/browser-playwright` の完全一致 peer（`vitest: 4.1.11`）が壊れないよう、vitest 系がまとめて更新される。

### 検証ゲート 5

- ローカルで `pnpm test:a11y` が通ること
- push 後、CI 上で `a11y` ジョブが成功すること
- 意図的に違反を入れた状態で CI が**失敗する**ことを確認する（FR-3 の本質。確認後は戻す）

### コミット 5

```
ci: run accessibility checks on pull requests
```

---

## フェーズ 6: ドキュメントと後始末（NFR-4）

### 6-1. `CLAUDE.md` の更新

- 「コマンド」節に `pnpm test:a11y` を追記
- 「テスト」の規約に以下を追記
  - a11y 検査は実ブラウザで全ストーリーに対して実行され、ライト / ダーク両配色を検査すること
  - 違反が出たときの対処方針（修正するか、ストーリー単位の `todo` + Issue 起票か）
  - `heading-order` を無効化しない方針とその理由

### 6-2. 繰り延べた違反の記録

4-4 で `todo` にした項目の一覧を `docs/specs/setup-a11y-testing/` 配下に記録し、追跡先 Issue を起票する。

### 6-3. 関連 Issue の起票

- `preview-head.html` の URL 文字列判定によるテーマ切り替えを `globalTypes` + decorator へ置き換える（設計 D-3 で別 Issue とした分）

### 検証ゲート 6

```bash
pnpm lint:check && pnpm format:check && pnpm typecheck && pnpm test && pnpm test:a11y
```

全て成功すること。

### コミット 6

```
docs: document the accessibility checking workflow
```

---

## 全体の受け入れ確認

`requirements.md` の受け入れ条件を最終確認する。

- [ ] `pnpm lint:check` が jsx-a11y 違反を検出し非ゼロ終了する（ゲート 1）
- [ ] 実ブラウザ axe 検査が単一コマンドで実行でき違反時に非ゼロ終了する（ゲート 4）
- [ ] `color-contrast` が実際に評価されている（4-3）
- [ ] 既存 `pnpm test` が従来どおり成功する（ゲート 2 / C-5）
- [ ] CI で 2 種類の検査が走り違反時に失敗する（ゲート 5）
- [ ] 既知の 3 件が解消または理由付きで抑制されている（フェーズ 1）
- [ ] `todo` の一覧と追跡先が記録されている（6-2）
- [ ] `CLAUDE.md` に実行方法と対処方針が記載されている（6-1）

## ユーザー確認が必要になるポイント

進行中に判断を仰ぐ箇所を事前に明示しておく。

| タイミング | 内容 |
| --- | --- |
| ゲート 3 | C-3 が覆った場合の案 B への設計変更 |
| 4-2 | `region` / `page-has-heading-one` 以外のルールを無効化する必要が生じた場合 |
| 4-4 | 検出された違反の件数と、修正 / 繰り延べの線引き |

## リスクと対応

| リスク | 影響 | 対応 |
| --- | --- | --- |
| C-3 が覆る（`preview-head.html` が適用される） | 案 A が成立せずダーク検査ができない | ゲート 3 で早期判定。案 B へ切り替え |
| C-1 でプラグインが引き継がれない | ストーリーが描画できない | 各プロジェクトに `plugins` を明示 |
| 既存違反が大量に出る | スコープが膨らむ | 4-4 で線引きをユーザーに確認。原則は繰り延べ + Issue 追跡 |
| CI 実行時間の大幅増 | 開発体験の悪化 | Chromium のみ + バイナリキャッシュ。ゲート 5 で実測し、許容範囲を超える場合は報告 |
