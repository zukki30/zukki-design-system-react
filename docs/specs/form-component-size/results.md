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

レビューを受けて次を足した。

| 内容 | コミット |
| --- | --- |
| size の union を `ControlSize` に集約し、既定値も 1 箇所にする | `refactor: give the control size union and its default one owner` |
| `InputNumber` のスピン列を `sm` でも 22px に据え置く | `fix: keep the InputNumber spin column at 22px in sm` |
| `Input` のアドーンメントをサイズに追従させる | `feat: scale the Input adornment with the input size` |
| `Checkbox` / `Radio` のラベルを箱の中央に揃える | `fix: center the Checkbox and Radio label against the control` |
| size のテストをコンポーネント自身の `label` に固定する | `test: anchor the size specs to each component's own label` |
| 判断をスタイルシートに残す | `docs: record the size decisions in the stylesheets` |
| `sm` でもラベルを 14px に据え置く | `fix: keep the FormField label at 14px in sm` |

## 公開 API の変化

型を 10 件追加した。

| 内容 | 件数 |
| --- | --- |
| size の union（`CheckboxSize` / `InputSize` / `InputNumberSize` / `RadioSize` / `SelectSize` / `SwitchSize` / `TextAreaSize` / `FormFieldSize`） | 8 |
| `useFormFieldState` の戻り値（`FormFieldResolvedState`） | 1 |
| `FormFieldControlState` に optional な `size` を追加 | （既存型の拡張） |

8 件の union はすべて内部の `ControlSize`（`src/types`）から派生させた。`exports` がパッケージルートしか公開していないため `ControlSize` 自体は利用側から import できない。既存の `ButtonSize` / `IconButtonSize` も同じ形に揃えたので、段を増減するときに直す場所は 1 つで済む。

### 破壊的変更

`Input` と `Select` で **HTML の `size` 属性を受け付けなくなった**（`Omit` で塞いだ）。独自の `size` と名前が衝突するためである。

| コンポーネント | 実態 |
| --- | --- |
| `Input` | `size`（表示文字数）を塞ぐ。幅は CSS で決めているため元から効いていない |
| `Select` | `size`（表示行数 = リストボックス表示）を塞ぐ。`appearance: none` と独自シェブロンがあるため元から正しく描画できない |
| `InputNumber` | `<input type="number">` に `size` は効かないため、実質的な変化なし |
| `TextArea` | React の `TextareaHTMLAttributes` に `size` が無く、元から型エラー。`Omit` は防御的に付けているだけ |

`Checkbox` / `Radio` / `Switch` は元から塞いでいたので変化なし。

## 既定の見た目の差分

`migrate-to-css-modules` の spec が残した計算後スタイルのスナップショットを流用し、変更前（`origin/main` の `cc11173`）と変更後を突き合わせた。

```bash
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts --out .tmp/snapshot-{before,after}.json
pnpm exec tsx docs/specs/migrate-to-css-modules/diff-computed-styles.ts .tmp/snapshot-before.json .tmp/snapshot-after.json
```

既存 105 ストーリー × ライト / ダークの全要素で、変化したプロパティは 2 種類だった（205 件）。

| 変化 | 要素数 | 内容 |
| --- | --- | --- |
| `align-items` / `justify-content`: `normal → center` | 42 | `Checkbox` / `Radio` / `Switch` の `__control`。当たり判定と見た目を分離するために足した宣言で、`md` では箱が当たり判定と同じ大きさのため位置は動かない |
| `padding-top`: `2px → 4px`、`padding-bottom`: `2px → 0px` | 28 | `Checkbox` / `Radio` のラベル。固定の 2px をやめ、当たり判定とラベルのフォントサイズから上パディングを算出するようにしたため、`md` でも値が動く |

**幅・高さ・フォントサイズ・色の差分は 0 件。** `Input` のアドーンメントは `md` では 24px に解決され、`<Icon>` の既定と同値のため見た目は変わっていない。

残りの差分は新規追加した 9 つのストーリー（`SizeSm` 8 件 + `SizeSmWithIcon`）が `before に存在しない` というものだけ。

## 検査

| コマンド | 結果 |
| --- | --- |
| `pnpm lint:check` | ✅ |
| `pnpm format:check` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm test` | ✅ 485 件（+29） |
| `pnpm check:css-types` | ✅ 20 件が最新（クラス名は増えていない） |
| `pnpm test:a11y` | ✅ 228 件（114 ストーリー × ライト / ダーク） |
| `pnpm verify:dist` | ✅ |

`pnpm test:a11y` は 1 度失敗した。新規追加した `FormField` の `SizeSm` ストーリーで、1 つの `FormField.Control` に入力を 3 つ並べたため id が注入されず、`<select>` が名前を持たなかった（`select-name`）。AGENTS.md の判断順どおり**ストーリー側を直した**（ルールの無効化はしていない）。

## 決めたこと

### `sm` でも入力テキストは 16px

iOS Safari は 16px 未満の入力欄にフォーカスするとページを自動ズームする。対応ブラウザに入っているため、`Input` / `InputNumber` / `TextArea` / `Select` の入力テキストは `sm` でも `--font-size-base` のままにした。`sm` の密度は余白・付属パーツ・ラベルで作っている。

### `sm` でも当たり判定は 24 × 24 px

`Checkbox` / `Radio` / `Switch` は、見た目の箱（`sm` で 20px、スイッチは 40 × 20px）と当たり判定（常に 24px）を別のカスタムプロパティに分けた。`__input` が `__control` を覆う構造なので、当たり判定だけを据え置けば WCAG 2.2 の 2.5.8 を満たせる。ラベルを持たない使い方（テーブルの行選択など）でも足りる。

### ただし `InputNumber` のスピンボタンだけは満たせない（[#116](https://github.com/zukki30/zukki-design-system-react/issues/116) で追跡）

> **解消済み（2026-09-24）.** #116 でスピンボタンを横並び（`−` / `+`）にし、`sm` / `md` とも 24 × 24px 以上を満たした。経緯は [`docs/specs/input-number-spin-target-size/`](../input-number-spin-target-size/) を参照。以下はこの spec を進めた時点の記録である。

スピンボタンは高さを自分で持たず、`flex: 1 1 0` でフィールドの高さを 2 分割する。そのため `sm` では 22 × 16.6px になる（`md` でも 22 × 20.6px で、元から 24px を割っていた）。

縦積みのままでは解消できない。24px × 2 + 区切り線 = 49px が必要で、`md` のフィールド高 42.1px にも入らないため、`min-height` で押し広げると `sm` が今の `md` より高くなる。

値の増減はフォーカス中の入力欄の ↑↓ キーと直接入力で同じことができ、入力欄自体は 24px を大きく超えるため、**2.5.8 の Equivalent 例外に依って繰り延べた**（スピンボタンは `tabIndex={-1}` でポインタ専用の補助として置いている）。判断は `InputNumber.module.css` にコメントで残した。`sm` でスピン列の幅を縮めるのはやめ、`md` と同じ 22px に据え置いている。

`axe-core` は target size を検査しないため `pnpm test:a11y` では検出できない。

### `sm` でも文字は下げない（ラベル・補助テキスト・必須バッジ）

要件では補助テキスト・エラーメッセージを 1 段、`FormField` のラベルを 14px → 12px に下げると書いたが、いずれも据え置いた。

- **補助テキスト・エラーメッセージ（12px）** … `--font-size-xs` の 1 段下は `--font-size-2xs`（10px）しかない。エラーメッセージを 10px にするのは可読性を損なう
- **`FormField` のラベル（14px）** … 12px に下げると `Checkbox` / `Radio` / `Switch` のラベル（`sm` で 14px）より小さくなり、**フィールド全体を名指すラベルが、その中の 1 項目を指すラベルより小さい**という逆転が起きる。補助テキスト（12px）との差も無くなる
- **必須バッジ（10px）** … `--font-size-2xs` が最小段。`padding-inline` だけ詰めた

実ブラウザで測った `sm` の階層は次のとおり。

| 要素 | `sm` |
| --- | --- |
| 入力テキスト | 16px |
| `FormField` のラベル / `Checkbox` のラベル | 14px |
| 補助テキスト | 12px |
| 必須バッジ | 10px |

`sm` の密度は `gap`（8 → 4px）・ラベル列の幅（100 → 80px）・ラベルの `padding-top`（12 → 8px）・入力欄の `padding-block`（12 → 8px）・必須バッジの `padding-inline`（4 → 2px）で出している。ラベル列の 80px は当初 12px のラベルに合わせた値だが、折り返しは 12px でも起きており、戻すと `sm` の横幅の詰まりが薄れるためそのままにした。

### 寸法の持ち主を CSS へ寄せた

サイズが可変になると TSX の定数と CSS の両方が同じ値を知ることになるため、次の 2 つを CSS へ移した。

- `Checkbox` の `ICON_SIZE = 24` → `.checkbox__icon` の `width/height: 100%` に任せる（元から CSS が勝っていた）
- `InputNumber` の `ARROW_SIZE = 16` → `--zds-input-number-arrow-size`（`Select` のシェブロンと同じ形）

`Input` のアドーンメントも同じ形にした。`Select` / `InputNumber` はすでに CSS 側が大きさを持っていたが、`Input` だけ利用側が渡したサイズのままで、`sm`（フィールド高 36px）に 24px のアイコンが並ぶ状態だった。`--zds-input-icon-size`（`md` 24px / `sm` 20px）を追加し、`.input__icon > svg` で当てている。直下の `svg` だけが対象なので、要素で包めば利用側が自分で大きさを決められる。

## 残した課題

- **`meta.render` にサイズ比較のセクションを足していない。** 計算後スタイルの突き合わせで既存ストーリーの DOM を保つことを優先した。autodocs でサイズを見比べたい場合は後から足せる
- **`lg` は用意していない。** `Button` / `IconButton` に `lg` が無いため、隣に並べたときに対応する段が無くなる。3 段階にするならボタン側と合わせて決める必要がある
- **`Checkbox` / `Radio` / `Switch` の `gap` は `sm` でも 8px。** 20px の箱に対して 4px はラベルが近すぎると判断した。実際に使ってみて詰めたくなったら変える
- ~~**`InputNumber` のスピンボタンが 24 × 24px に届かない。** 縦並びのレイアウトを変えないと解消しないため [#116](https://github.com/zukki30/zukki-design-system-react/issues/116) で追跡する~~ → **解消済み（2026-09-24）**。[`docs/specs/input-number-spin-target-size/`](../input-number-spin-target-size/)
- **`FormField` のラベルと `Checkbox` のラベルが `sm` で同じ 14px。** 逆転は解消したが、グループ名が項目名より大きくはならない。14px と 12px の間にトークンが無いため、必要なら段を足すところから決める
