# 要件: InputNumber のスピンボタンを 24 × 24px 以上にする

対象 Issue: [#116 InputNumber のスピンボタンが WCAG 2.2 の 2.5.8（Target Size）を満たしていない](https://github.com/zukki30/zukki-design-system-react/issues/116)

## Issue の指示

> スピンボタンを **横並び**にして、1 つあたり 24px 以上を確保する。
>
> - `−` / `+` をフィールドの左右に置く、または右側に横 2 列で置く
> - `sm` でもフィールド高は 34.1px あるため、幅 24px を確保すれば 24 × 34px で基準を満たせる

## 事前に確認した方針

要件を書く前に 2 点を確認した。以降の記述はこの回答を前提にしている。

| 論点 | 決定 |
| --- | --- |
| レイアウト | **右側に横 2 列**。現在の「右端にスピン列」という構造を保ち、数値は従来どおり左揃えのまま |
| アイコン | **`−` / `+`**。横並びでは上下矢印の向きが操作方向と対応しなくなるため。`plus` の SVG を新規追加する |

## 現状（実測値）

`main`（`0209f3a`）のソースから計算した値である。

### A. 寸法の内訳

```
行ボックス      = --font-size-base 16px × --line-height-line 113.4% = 18.144px
フィールド高    = 18.144 + --zds-input-number-padding-block × 2
スピンボタン高  = (フィールド高 − 区切り線 1px) ÷ 2
```

| サイズ | 上下パディング | フィールド高 | スピン列幅 | スピンボタン 1 つ | 2.5.8 |
| --- | --- | --- | --- | --- | --- |
| `md` | `--spacing-md` 12px | 42.1px | 22px | **22 × 20.57px** | ❌ |
| `sm` | `--spacing-sm` 8px | 34.1px | 22px | **22 × 16.57px** | ❌ |

### B. 現在の DOM 構造

```
div.inputNumber                 … data-size / data-error / data-disabled を持つ
├── input.inputNumber__field    … type="number"
└── div.inputNumber__spin       … flex-direction: column、border-inline-start 1px
    ├── button                  … aria-label="増やす"、Icon name="menuUp"
    ├── span.inputNumber__spinDivider … height 1px
    └── button                  … aria-label="減らす"、Icon name="menuDown"
```

スピンボタンは `flex: 1 1 0` で高さを持たず、フィールドの高さを 2 分割している。

### C. 繰り延べの記録が残っている場所

| 場所 | 内容 |
| --- | --- |
| `src/components/InputNumber/InputNumber.module.css` L142-155 | Equivalent 例外に依る判断と #116 への追跡コメント |
| `docs/specs/form-component-size/results.md` L99-107, L142 | #108 対応時の積み残しとしての記録 |

### D. アイコンの在庫

| 名前 | 状態 |
| --- | --- |
| `baselineMinus` | ✅ 既存（`M19 12.998H5V10.998H19V12.998Z`） |
| `plus` | ❌ 無い。新規に追加する |

`iconNames` の一覧は `dist/AGENTS.md` へ自動で差し込まれ（`scripts/build-agent-guide.ts`）、`pnpm verify:dist` が網羅性を検査している。手書きの一覧は無い。

## 要件

### R1. スピンボタンが 24 × 24 CSS px 以上であること【必須】

`sm` / `md` のどちらでも、`−` / `+` それぞれの**クリック領域**が 24 × 24px 以上であること。

| サイズ | ボタン 1 つ | 判定 |
| --- | --- | --- |
| `md` | 24 × 42.1px | ✅ |
| `sm` | 24 × 34.1px | ✅ |

- 隣接するボタン同士では 2.5.8 の spacing 例外が使えないため、**寸法そのもので満たす**
- `Tag` のような擬似要素での当たり判定拡張は使わない。隣のボタンと重なり、どちらが反応するかが出力順に左右されるため

### R2. レイアウトは「フィールドの右に `−` `+` の横 2 列」であること【必須】

```
┌──────────────┬────┬────┐
│ 1,234        │ −  │ +  │
└──────────────┴────┴────┘
  min 80px      24px 24px
```

- `−` を左、`+` を右に置く。**DOM の順序も見た目と揃える**（現在は「増やす」が先）
- 数値の揃えは変えない（左揃えのまま）
- 区切り線は「2 ボタンの間の縦線 1px」と「列全体の左境界 1px」の 2 本になる
- スピン領域の幅は `1 + 24 + 1 + 24 = 50px`。現状の `1 + 22 = 23px` から **+27px**

### R3. アイコンを `−` / `+` にすること【必須】

- 「増やす」は新規追加する `plus`、「減らす」は既存の `baselineMinus` を使う
- `plus` は `baselineMinus` と同じ 24 × 24 の viewBox・同じ線幅（2px）で描く。`M19 12.998H5V10.998H19V12.998Z` を縦横に組み合わせた形にする
- 追加にあたり触る場所は `src/components/Icon/svg/IconPlus.tsx` / `svg/index.ts` / `types.ts` の 3 つ。一覧は自動生成のため手で書き写す箇所は無い

### R4. 既存の振る舞いを変えないこと【必須】

次はすべて現状のまま維持する。既存のユニットテストが全部通ることで担保する。

| 項目 | 現状 |
| --- | --- |
| フォーカス | スピンボタンは `tabIndex={-1}`。Tab では止まらない |
| 増減 | `stepUp()` / `stepDown()` を呼び、`input` イベントを手動発火して `onChange` へ伝える |
| フォーカス保持 | `onMouseDown` で `preventDefault()` し、入力欄のフォーカスを奪わない |
| アクセシブルネーム | `aria-label="増やす"` / `aria-label="減らす"` |
| `disabled` / `error` | `FormField` から引き継ぎ、自身の指定を優先する |
| `size` | `sm` / `md`。`FormField` から引き継ぐ |
| `ref` 転送・`inputMode` の出し分け | 変更なし |

### R5. 見た目の一貫性を保つこと【必須】

- `sm` でも列幅は 24px から縮めない（R1 のため）。`md` と同じ値を使う
- アイコンの描画サイズは `md` 24px / `sm` 20px とし、`Input` のアドーンメント（`--zds-input-icon-size`）と揃える
  - 当初は現状の出し分け（`md` 16px / `sm` 14px）を引き継ぐ予定だったが、設計フェーズで変更した。16 / 14 は「22 × 20.6px のボタンに収める」ための値であり、ボタンが 24 × 42.1px になると前提が変わる。理由は [`design.md` の「要件からの変更点（承認済み）」](./design.md#要件からの変更点承認済み) を参照
- hover / disabled / error の配色、`border-radius`、`focus-within` の outline は現状のまま
- 角の内側にボタンがはみ出さないよう、ルートの `overflow: hidden` は維持する

### R6. 全体幅が広がることを許容する【前提】

`min-width` 到達時の全体幅は `md` で 105px → 132px（`sm` で 89px → 116px）になる。

- フィールドの最小幅（`md` 80px / `sm` 64px）は**縮めない**。数値の桁が隠れるほうが実害が大きいため
- ルートは `display: inline-flex` のままで、幅は内容に従う

### R7. 自動で検証できる形にすること【必須】

Issue にあるとおり `axe-core` は target size を検査しない。**目視だけに頼らず、24px を割ったら CI が落ちる**状態にする。

- jsdom はレイアウトしないため `pnpm test` では測れない。実ブラウザで動く `pnpm test:a11y` 側で測る
- 検査するのは `sm` / `md` の両方。片方だけでは `sm` の退行を拾えない
- 具体的な実現方法（Storybook の play function か、ブラウザプロジェクト向けのテストファイルか）は設計フェーズで決める

### R8. 繰り延べの記録を更新すること【必須】

| 対象 | やること |
| --- | --- |
| `InputNumber.module.css` のコメント | Equivalent 例外の説明を削除し、「24px をどう確保しているか」の説明に差し替える |
| `docs/specs/form-component-size/results.md` | 積み残しが解消したことを追記する（過去の記録なので書き換えではなく追記） |
| Issue #116 | 対応 PR で close する |

### R9. 配布物の検査を通すこと【必須】

- `pnpm verify:dist` を通す（`plus` が `dist/AGENTS.md` の一覧へ入ることの確認を含む）
- `InputNumber` の公開 API（`InputNumberProps` / `InputNumberSize`）は変えないため、`README.md` のコンポーネント一覧と `docs/agent-guide.template.md` の `descriptions` は変更不要
- ただし `IconName` / `iconNames` は `src/main.tsx` から export しており、**`plus` の追加はそれ自体が公開 API の変更にあたる**（後方互換の追加）。ファイルを触る必要は無いが、リリースノートには書く

## やらないこと

| 項目 | 理由 |
| --- | --- |
| `−` / `+` をフィールドの左右に分離する | 検討のうえ「右に横 2 列」を選んだ |
| スピンボタンをフォーカス可能にする | 入力欄の ↑↓ で同じ操作ができ、Tab の停止点が 3 倍に増えるほうが害になる |
| 長押しによる連続増減 | Issue の範囲外。必要になった時点で別 Issue にする |
| フィールド高（`md` 42.1px / `sm` 34.1px）の変更 | `Input` / `Select` と高さが揃わなくなる |
| 他コンポーネントの target size 見直し | `Checkbox` / `Radio` / `Switch` / `Tag` はすでに 24px を満たしている |

## 完了条件

- [ ] `sm` / `md` の両方で `−` / `+` が 24 × 24px 以上（実ブラウザでの測定による自動検査つき）
- [ ] 既存のユニットテストが変更なしで通る（DOM 順序の入れ替えで壊れないこと）
- [ ] `pnpm lint:check` / `pnpm format:check` / `pnpm typecheck` / `pnpm test` / `pnpm test:a11y` / `pnpm verify:dist` がすべて通る
- [ ] `light` / `dark` 両配色で Storybook の見た目が崩れていない
- [ ] CSS コメントと `form-component-size/results.md` の記録が更新されている
