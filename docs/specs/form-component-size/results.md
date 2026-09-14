# 結果: フォーム系コンポーネントに size prop を追加する

対象 Issue: [#108](https://github.com/zukki30/zukki-design-system-react/issues/108)
要件: [`requirements.md`](./requirements.md) / 設計: [`design.md`](./design.md) / 計画: [`implementation-plan.md`](./implementation-plan.md)

## やったこと

| ステップ | コミット |
| --- | --- |
| 1. `FormField` が size を配る | `feat: let FormField share its size with the controls inside` |
| 2. テキスト入力系 3 つ | `feat: add a size prop to Input, InputNumber and TextArea` |
| 3. `Select` | `feat: add a size prop to Select` |
| 4. 選択系 3 つ | `feat: add a size prop to Checkbox, Radio and Switch` |
| 5. 利用側向けのガイド | `docs: document the form control size in the agent guide` |
| 6. 検査で見つけたストーリーの不備 | `test: name every control in the FormField size story` |

## 公開 API の変化

型を 10 件追加した。

| 内容 | 件数 |
| --- | --- |
| size の union（`CheckboxSize` / `InputSize` / `InputNumberSize` / `RadioSize` / `SelectSize` / `SwitchSize` / `TextAreaSize` / `FormFieldSize`） | 8 |
| `useFormFieldState` の戻り値（`FormFieldResolvedState`） | 1 |
| `FormFieldControlState` に optional な `size` を追加 | （既存型の拡張） |

### 破壊的変更が 1 つある

`Input` / `InputNumber` / `Select` / `TextArea` で **HTML の `size` 属性を受け付けなくなった**（`Omit` で塞いだ）。

これらの `size` は「表示文字数」「表示行数」を指すもので、幅も高さも CSS で決めている本ライブラリでは効かないか、レイアウトを壊す。独自の `size` と名前が衝突するため塞いだ。渡していたコードがあれば型エラーになる。

`Checkbox` / `Radio` / `Switch` は元から塞いでいたので変化なし。

## 既定の見た目を変えていないことの確認

`migrate-to-css-modules` の spec が残した計算後スタイルのスナップショットを流用し、変更前（`origin/main` の `cc11173`）と変更後を突き合わせた。

```bash
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts --out .tmp/snapshot-{before,after}.json
pnpm exec tsx docs/specs/migrate-to-css-modules/diff-computed-styles.ts .tmp/snapshot-before.json .tmp/snapshot-after.json
```

既存 105 ストーリー × ライト / ダークの全要素で、**変化したプロパティは 2 種類だけ**だった。

| 変化 | 件数 | 内容 |
| --- | --- | --- |
| `align-items: normal → center` | 42 | `Checkbox` / `Radio` / `Switch` の `__control` |
| `justify-content: normal → center` | 42 | 同上 |

どちらも当たり判定と見た目を分離するために足した宣言で、`md` では箱が当たり判定と同じ大きさのため位置は動かない。幅・高さ・余白・フォントサイズの差分は **0 件**。

残りの差分は新規追加した 8 つの `SizeSm` ストーリー（`before に存在しない`）のみ。

## 検査

| コマンド | 結果 |
| --- | --- |
| `pnpm lint:check` | ✅ |
| `pnpm format:check` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm test` | ✅ 485 件（+29） |
| `pnpm check:css-types` | ✅ 20 件が最新（クラス名は増えていない） |
| `pnpm test:a11y` | ✅ 226 件（ライト / ダーク） |
| `pnpm verify:dist` | ✅ |

`pnpm test:a11y` は 1 度失敗した。新規追加した `FormField` の `SizeSm` ストーリーで、1 つの `FormField.Control` に入力を 3 つ並べたため id が注入されず、`<select>` が名前を持たなかった（`select-name`）。AGENTS.md の判断順どおり**ストーリー側を直した**（ルールの無効化はしていない）。

## 決めたこと

### `sm` でも入力テキストは 16px

iOS Safari は 16px 未満の入力欄にフォーカスするとページを自動ズームする。対応ブラウザに入っているため、`Input` / `InputNumber` / `TextArea` / `Select` の入力テキストは `sm` でも `--font-size-base` のままにした。`sm` の密度は余白・付属パーツ・ラベルで作っている。

### `sm` でも当たり判定は 24 × 24 px

`Checkbox` / `Radio` / `Switch` は、見た目の箱（`sm` で 20px、スイッチは 40 × 20px）と当たり判定（常に 24px）を別のカスタムプロパティに分けた。`__input` が `__control` を覆う構造なので、当たり判定だけを据え置けば WCAG 2.2 の 2.5.8 を満たせる。ラベルを持たない使い方（テーブルの行選択など）でも足りる。

### 補助テキスト・エラーメッセージは `sm` でも 12px

要件では 1 段小さくすると書いたが、`--font-size-xs`（12px）の 1 段下は `--font-size-2xs`（10px）しかない。エラーメッセージを 10px にするのは可読性を損なうため据え置いた。必須バッジも同じ理由でフォントサイズは変えず、`padding-inline` だけ詰めた。

### 寸法の持ち主を CSS へ寄せた

サイズが可変になると TSX の定数と CSS の両方が同じ値を知ることになるため、次の 2 つを CSS へ移した。

- `Checkbox` の `ICON_SIZE = 24` → `.checkbox__icon` の `width/height: 100%` に任せる（元から CSS が勝っていた）
- `InputNumber` の `ARROW_SIZE = 16` → `--zds-input-number-arrow-size`（`Select` のシェブロンと同じ形）

## 残した課題

- **`meta.render` にサイズ比較のセクションを足していない。** 計算後スタイルの突き合わせで既存ストーリーの DOM を保つことを優先した。autodocs でサイズを見比べたい場合は後から足せる
- **`lg` は用意していない。** `Button` / `IconButton` に `lg` が無いため、隣に並べたときに対応する段が無くなる。3 段階にするならボタン側と合わせて決める必要がある
- **`Checkbox` / `Radio` / `Switch` の `gap` は `sm` でも 8px。** 20px の箱に対して 4px はラベルが近すぎると判断した。実際に使ってみて詰めたくなったら変える
