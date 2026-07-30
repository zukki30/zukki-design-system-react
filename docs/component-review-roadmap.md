# コンポーネントレビュー 改善ロードマップ

全19コンポーネントを3つのスキル（`web-design-guidelines` / `react-best-practices` / `composition-patterns`）でレビューした結果を、実装単位の Issue（#5〜#23）に分割し、**推奨する着手順**をまとめたものです。

- 元レビュー Issue（クローズ済み）: #2（UI/a11y）・#3（パフォーマンス）・#4（API設計）
- ラベル: `accessibility` / `performance` / `api-design` / `breaking-change` / `enhancement`

## 進め方の原則

1. **基盤（Phase 0）を最初に。** 共通 mixin/スタイルを用意し、後続がそれに乗る。
2. **非破壊・高価値の a11y High（Phase 1）を優先。**
3. **Phase 2〜4 は互いにほぼ独立・非破壊 → 並行して消化可能。**
4. **破壊的変更（Phase 5）は最後。** 着手前に**バージョン方針**（メジャー更新 or 旧 prop を deprecated 併存）を決定する。

## 推奨着手順（フェーズ順）

### Phase 0 — 基盤（最初 / 非破壊）

| 順 | Issue | 内容 | 依存 |
|---|---|---|---|
| 1 | #5 (S1) | `prefers-reduced-motion` 共通 mixin を追加し全アニメーションに適用 | なし |
| 2 | #6 (S2) | `touch-action` 共通スタイルを用意しインタラクティブ要素に適用 | なし |

### Phase 1 — a11y High（非破壊 / 最優先）

| 順 | Issue | 内容 | 依存 |
|---|---|---|---|
| 3 | #7 (S3) | Dialog モーダル基盤（`overscroll-behavior` + body スクロールロック） | #6 |
| 4 | #8 (S4) | Steps に `aria-current` + 状態のテキスト表現 | なし |
| 5 | #9 (S5) | IconButton の `aria-label` を型で必須化 | なし |
| 6 | #10 (S6) | FormField の a11y 基盤（`useId` + `aria-describedby` + `role=alert`） | なし |

### Phase 2 — 横断スタイル（非破壊 / 並行可）

| 順 | Issue | 内容 | 依存 |
|---|---|---|---|
| 7 | #11 (S7) | `:focus-visible` 統一 + Tag 閉じるボタンの focus・タッチターゲット | なし |
| 8 | #12 (S8) | Select のダークモード対応（`color-scheme` + option 背景） | なし |
| 9 | #13 (S9) | 長文コンテンツ対応（`min-width:0` + truncate） | なし |
| 10 | #14 (S10) | フォーム入力・ローディングの細部 a11y | なし |

### Phase 3 — 実装クリーンアップ（非破壊 / 並行可）

| 順 | Issue | 内容 | 依存 |
|---|---|---|---|
| 11 | #15 (S11) | 不要 useMemo 削除 + Tooltip 正規表現・静的JSX 巻き上げ | なし |
| 12 | #16 (S12) | コード品質（命名・デッドコード・key・ref callback） | なし |
| 13 | #17 (S13) | barrel → 直接 import 統一 + Input の条件描画 | なし |

### Phase 4 — API ref-as-prop（非破壊 / 実利大）

| 順 | Issue | 内容 | 依存 |
|---|---|---|---|
| 14 | #18 (S14) | React 19 ref-as-prop 全面対応（8コンポーネント） | なし |

### Phase 5 — 破壊的変更（要バージョン方針 / 最後）

> ⚠️ 着手前に **メジャーバージョン更新** か **旧 prop を deprecated 併存** かの方針を決定する。

| 順 | Issue | 内容 | 依存 |
|---|---|---|---|
| 15 | #19 (S15) | boolean prop → variant（Skeleton `circle`→`shape`、Steps `vertical`→`orientation`） | バージョン方針 |
| 16 | #20 (S16) | Card を compound components 化 | バージョン方針 |
| 17 | #21 (S17) | Dialog を compound components 化 | #7 / バージョン方針 |
| 18 | #22 (S18) | Steps を compound components 化 | #8 / バージョン方針 |
| 19 | #23 (S19) | FormField を context/compound 化（状態の自動伝播） | #10 / バージョン方針 |

## 依存関係の要点

- **#6 → #7**（touch-action 共通スタイルを Dialog でも使う）
- **#7 → #21** / **#8 → #22** / **#10 → #23**（非破壊の a11y 修正を先に入れてから compound 化）
- Phase 2〜4（#11〜#18）は依存がなく、**任意の順序・並行で着手可能**。

## 並行実行の目安

- 非破壊フェーズ（#5〜#18）は担当を分ければ **Phase 1〜4 を並行**で進められる（基盤 #5/#6 のマージ後）。
- 破壊的フェーズ（#19〜#23）は各 Issue が大きく、バージョン方針の確定を前提に**1件ずつ丁寧に**。

---

*このロードマップは 3 スキルによる静的レビュー（コード読解）に基づく。行番号は各 Issue 作成時点のもの。実描画・スクリーンリーダー挙動の最終確認は Storybook で別途推奨。*
