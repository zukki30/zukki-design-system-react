# 実装計画: フォーム系コンポーネントに size prop を追加する

対象 Issue: [#108](https://github.com/zukki30/zukki-design-system-react/issues/108)
要件: [`requirements.md`](./requirements.md) / 設計: [`design.md`](./design.md)

## 進め方

ブランチは `feature/form-component-size`（`origin/main` の `cc11173` から作成済み）。

7 ステップに分け、**各ステップの終わりに `pnpm lint:check` / `pnpm format:check` / `pnpm typecheck` / `pnpm test` を通してからコミット**する。どのステップで止まっても CI が緑のままになる粒度にしている。

`pnpm test:a11y` と `pnpm verify:dist` は実行に時間がかかるため、ステップ 6 でまとめて回す。

## 設計から 1 点調整する

設計 9 節に「`meta` の `render` にサイズ比較のセクションを追加する」と書いたが、**`meta.render` は触らない**ことにする。

理由は受け入れ条件 2（`size` 未指定時の描画結果が変更前と一致する）の検証方法にある。`migrate-to-css-modules` の spec が残した `snapshot-computed-styles.ts` / `diff-computed-styles.ts` を流用すると、全ストーリーの計算後スタイルをライト / ダーク両方で突き合わせられる。ところが `meta.render` を変えると `Default` などの既存ストーリーの DOM が変わり、**本当に見たい「CSS の変更が既定の見た目に影響していないか」が差分に埋もれてしまう。**

サイズの比較は `SizeSm` ストーリーの追加だけで足りる（`Card` も同じ形）。

## ステップ 0: 変更前のスナップショットを取る

実装を始める前に、`origin/main` の状態で計算後スタイルを記録する。

```bash
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts \
  --out .tmp/snapshot-before.json
```

`.tmp/` は成果物ではないのでコミットしない。ステップ 6 で突き合わせる。

## ステップ 1: `FormField` が size を配れるようにする

| ファイル | 変更 |
| --- | --- |
| `src/components/FormField/FormFieldContext.ts` | `FormFieldSize` / `FormFieldResolvedState` を追加。`state.size` を追加。`useFormFieldState` が `size` を解決して返す |
| `src/components/FormField/FormField.tsx` | `size?: FormFieldSize`（既定 `'md'`）を受け、context と `data-size` に流す。`useMemo` の依存配列に `size` を足す |
| `src/components/FormField/FormField.module.css` | サイズで変わる 5 値をルートのカスタムプロパティに括り出し、`[data-size='sm']` で差し替える |
| `src/components/FormField/index.ts` | `FormFieldSize` / `FormFieldResolvedState` を再 export |
| `src/main.tsx` | 同 2 型を公開 |

CSS の変更点は設計 4-6 のとおり。既存の宣言を変数参照に置き換えるだけで、`md` の計算後の値は変わらない。

```css
.formField {
  --zds-form-field-label-column-width: 100px;      /* 既存。値は据え置き */
  --zds-form-field-gap: var(--spacing-sm);
  --zds-form-field-label-font-size: var(--font-size-sm);
  --zds-form-field-label-padding-top: var(--spacing-md);
  --zds-form-field-required-badge-padding-inline: var(--spacing-xs);

  gap: var(--zds-form-field-gap);
}

.formField[data-size='sm'] {
  --zds-form-field-label-column-width: 80px;
  --zds-form-field-gap: var(--spacing-xs);
  --zds-form-field-label-font-size: var(--font-size-xs);
  --zds-form-field-label-padding-top: var(--spacing-sm);
  --zds-form-field-required-badge-padding-inline: var(--spacing-2xs);
}
```

参照側の差し替え: `.formField__label` と `.formField__requiredAsterisk` の `font-size`、横並び時のラベルの `padding-top`、`.formField__requiredBadge` の `padding-inline`、`.formField__control` の `gap`。

**テスト:**

- `FormFieldContext.spec.tsx` に `useFormFieldState` の `size` 解決 4 ケース（設計 8-1）
- `FormField.spec.tsx` に `data-size` の既定 / 明示 2 ケース

**ストーリー:** `FormField.stories.tsx` に `SizeSm` を追加する。配下に `Input` / `Select` / `Checkbox` を置き、**ステップ 4 完了後には伝播が効いた状態が a11y 検査に載る**ようにしておく。

> この時点では配下の入力要素はまだ `size` を受け取らないため、`SizeSm` はラベルだけが縮んだ見た目になる。ステップ 4 まで進むと揃う。

```
feat: let FormField share its size with the controls inside
```

## ステップ 2: `Input` / `InputNumber` / `TextArea`

3 つとも同じ手順。

1. `XxxSize` 型を定義し JSDoc を付ける
2. `Omit<ComponentPropsWithRef<…>, … | 'size'>` にネイティブ `size` を追加
3. `size?: XxxSize` を props に追加（JSDoc は「未指定のときは FormField の size を引き継ぐ」「`@default 'md'`」）
4. `size: sizeProp` で受け、`useFormFieldState` に渡す。**分割代入で既定値を書かない**
5. ルート要素に `data-size={size}` を出力
6. `*.module.css` に `[data-size='sm']` を追加
7. `index.ts` と `src/main.tsx` に型を追加
8. `*.spec.tsx` に 4 ケース（設計 8-2）、`*.stories.tsx` に `SizeSm`

個別の注意点:

- **`InputNumber`**: `ARROW_SIZE = 16` の定数を削除し、`<Icon name="menuUp" />` から `width` / `height` を外す。CSS に `--zds-input-number-arrow-size`（`md` 16px / `sm` 14px）と `.inputNumber__spinButton > svg { width: …; height: … }` を足す（`Select` のシェブロンと同じ形）
- **`TextArea`**: ルート要素が `textarea` そのもの。`data-error` / `data-size` を `{...props}` の**後ろ**へ置く（設計 6 節の確認済みの変更）。`min-height` は `md` 136px / `sm` 104px

```
feat: add a size prop to Input, InputNumber and TextArea
```

## ステップ 3: `Select`

手順はステップ 2 と同じ。CSS は 3 つの変数で完結する。

```css
.select {
  --zds-select-icon-size: 20px;                      /* 既存 */
  --zds-select-padding-block: var(--spacing-md);     /* 新規 */
  --zds-select-border-radius: var(--border-radius-lg); /* 新規 */
}

.select[data-size='sm'] {
  --zds-select-icon-size: 16px;
  --zds-select-padding-block: var(--spacing-sm);
  --zds-select-border-radius: var(--border-radius-md);
}
```

`padding-inline-end` の `calc(var(--spacing-sm) * 2 + var(--zds-select-icon-size))` は既存のまま。アイコンが縮めば右の余白も追従する。

```
feat: add a size prop to Select
```

## ステップ 4: `Checkbox` / `Radio` / `Switch`

当たり判定と見た目を分離する（設計 4-5）。**この 3 つだけ CSS の構造に手が入る**ため、`md` の出力が変わっていないことをステップ 6 の差分で特に注意して確認する。

`Checkbox` / `Radio` 共通:

```css
.checkbox {
  --zds-checkbox-control-size: 24px;   /* 新規。当たり判定。sm でも据え置き */
  --zds-checkbox-box-size: 24px;       /* 既存。意味を「見た目」に限定 */
  --zds-checkbox-label-font-size: var(--font-size-base);
}

.checkbox[data-size='sm'] {
  --zds-checkbox-box-size: 20px;
  --zds-checkbox-label-font-size: var(--font-size-sm);
}

.checkbox__control {
  align-items: center;      /* 追加 */
  justify-content: center;  /* 追加 */
  width: var(--zds-checkbox-control-size);
  height: var(--zds-checkbox-control-size);
}
```

- `Checkbox` は `ICON_SIZE = 24` の定数を削除し、`<Icon>` から `width` / `height` を外す（`.checkbox__icon` の `width/height: 100%` がすでに効いている）
- `Radio` は上記に加えて `--zds-radio-dot-size` を `sm` で 8px にする
- `Switch` は `--zds-switch-control-height`（新規・常に 24px）を追加し、`.switch__control` の `height` をそれに、`align-items: center` を追加。`sm` でトラック 40×20px・つまみ 16px。移動量の `calc()` は既存の式のまま

**テストに 1 ケース足す:** `sm` でも `__control` のサイズが `md` と同じであること（R7 の担保）。jsdom では計算後のサイズが取れないため、**`data-size` の確認にとどめ、実寸は `pnpm test:a11y` と Storybook 上の目視で確認する**方針とする。

```
feat: add a size prop to Checkbox, Radio and Switch
```

## ステップ 5: 利用側へ届ける情報

`docs/agent-guide.template.md` の「覚えておくこと」に 1 行追加する（設計 10 節）。公開型の一覧はソースから差し込まれるため手で書かない。

```
docs: document the form control size in the agent guide
```

## ステップ 6: 検査

```bash
# CI と同じ一式
pnpm lint:check
pnpm format:check
pnpm typecheck
pnpm test
pnpm check:css-types
pnpm test:a11y
pnpm verify:dist
```

続いて、既定時の見た目が変わっていないことを確認する。

```bash
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts \
  --out .tmp/snapshot-after.json
pnpm exec tsx docs/specs/migrate-to-css-modules/diff-computed-styles.ts \
  .tmp/snapshot-before.json .tmp/snapshot-after.json
```

**期待する結果:** 差分として出るのは新規追加した `SizeSm` ストーリー（`before に存在しない`）だけ。既存ストーリーに 1 件でも差分が出たら、`md` の値をどこかで変えてしまっている。

`pnpm check:css-types` はクラス名が増えていないことの確認になる（追加したのは属性セレクタとカスタムプロパティだけなので `*.module.css.d.ts` は変わらないはず）。

## ステップ 7: 記録と PR

- `docs/specs/form-component-size/results.md` を書く（他の spec と同じ形式: やったこと / 公開 API の変化 / 検査結果 / 残した課題）
- PR を作成する。利用側から見た変化、**ネイティブ `size` 属性を塞いだことによる破壊的変更**、`sm` / `md` を並べた Storybook のスクリーンショットを載せる

```
docs: record the outcome of the form control size work
```

## コミット一覧

| # | メッセージ |
| --- | --- |
| 1 | `feat: let FormField share its size with the controls inside` |
| 2 | `feat: add a size prop to Input, InputNumber and TextArea` |
| 3 | `feat: add a size prop to Select` |
| 4 | `feat: add a size prop to Checkbox, Radio and Switch` |
| 5 | `docs: document the form control size in the agent guide` |
| 6 | `docs: record the outcome of the form control size work` |

## 想定される詰まりどころ

| 箇所 | 起きうること | 対処 |
| --- | --- | --- |
| `size: sizeProp = 'md'` と書いてしまう | `FormField` の指定が効かなくなる。テストの 3 番目のケースで落ちる | 分割代入に既定値を書かない。既定は `useFormFieldState` だけが持つ |
| `data-size` を `{...props}` より前に置く | 利用側から上書きできてしまう | ルートに `{...props}` が届くのは `TextArea` と `FormField` のみ。この 2 つは順序に注意 |
| `.checkbox__control` の構造変更 | `md` の見た目が 1px ずれる | ステップ 6 の計算後スタイル差分で検出する |
| `FormFieldControlState` の変更 | 利用側の破壊的変更 | 追加するのは optional なプロパティのみ。戻り値は別型（`FormFieldResolvedState`）にする |
| `pnpm test:a11y` の `color-contrast` | ラベルを 14px / 12px に下げた結果、判定が変わる | 配色トークンは変えていないため原理的には出ないはず。出た場合は実装を直す（ルールの無効化はしない） |
