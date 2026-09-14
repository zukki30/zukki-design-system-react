# 設計: フォーム系コンポーネントに size prop を追加する

対象 Issue: [#108](https://github.com/zukki30/zukki-design-system-react/issues/108) / 要件: [`requirements.md`](./requirements.md)

## 全体方針

3 つの原則で組み立てる。

1. **既定値（`md`）の出力を 1 バイトも変えない。** サイズで変わる値は「いまの値」をそのまま既定に置き、`[data-size='sm']` で差分だけを書く（`Card` と同じ形）
2. **サイズ差分は CSS のルート 2 ブロックに集める。** `.x { … }` と `.x[data-size='sm'] { … }` を読めばそのコンポーネントの寸法差が全部分かる状態にする
3. **`'md'` という既定値をコードの 1 か所だけに置く。** `useFormFieldState` が解決するので、7 コンポーネントに既定値が散らない

## 1. 型の設計

### 1-1. コンポーネントごとの size 型

`Button` / `IconButton` と同じ形で、各実装ファイルに置いて公開する。

```ts
// src/components/Input/Input.tsx
import type { SizeType } from '@/types';

/**
 * 入力のサイズ。`sm` / `md` の 2 段階。
 *
 * `lg` は意図的に持たない。Button / IconButton に `lg` が無く、
 * 並べたときに対応する段が無くなるため
 */
export type InputSize = Exclude<SizeType, 'lg'>;
```

| 型名 | 置き場所 |
| --- | --- |
| `CheckboxSize` | `src/components/Checkbox/Checkbox.tsx` |
| `InputSize` | `src/components/Input/Input.tsx` |
| `InputNumberSize` | `src/components/InputNumber/InputNumber.tsx` |
| `RadioSize` | `src/components/Radio/Radio.tsx` |
| `SelectSize` | `src/components/Select/Select.tsx` |
| `SwitchSize` | `src/components/Switch/Switch.tsx` |
| `TextAreaSize` | `src/components/TextArea/TextArea.tsx` |
| `FormFieldSize` | `src/components/FormField/FormFieldContext.ts` |

`FormFieldSize` だけ context ファイルに置く。`CardSize` を `CardContext.ts` に置いているのと同じ理由で、context の `state` が参照する型だからである。

### 1-2. ネイティブの `size` 属性を塞ぐ

| コンポーネント | 現状 | 変更後 |
| --- | --- | --- |
| `Checkbox` / `Radio` / `Switch` | すでに `'size'` を `Omit` 済み | 変更なし |
| `Input` / `InputNumber` | `Omit<…, 'prefix' \| 'suffix'>` | `'size'` を追加 |
| `Select` | `Omit<…, 'prefix' \| 'suffix'>` | `'size'` を追加 |
| `TextArea` | `Omit<…, 'prefix' \| 'suffix'>` | `'size'` を追加（`textarea` に `size` 属性は無いが、型の形を 7 つで揃える） |

### 1-3. props への追加

7 コンポーネントすべて同じ JSDoc の形にする。

```ts
  /**
   * 入力のサイズ。未指定のときは FormField の size を引き継ぐ
   * @default 'md'
   */
  size?: InputSize;
```

## 2. `FormField` からの伝播

### 2-1. context に `size` を足す

```ts
// FormFieldContext.ts
export type FormFieldContextValue = {
  state: {
    required: boolean;
    requiredMark: FormFieldRequiredMark;
    disabled: boolean;
    error: boolean;
    /** 入力欄とラベルのサイズ */
    size: FormFieldSize;   // ← 追加
  };
  actions: { …変更なし };
  meta: { …変更なし };
};
```

`FormField` 側は `size = 'md'` を分割代入の既定値で受け、`useMemo` の依存配列に `size` を足す。

### 2-2. `useFormFieldState` の戻り値

`error` / `disabled` は「未指定なら `undefined`」を返しているが、`size` は**常に確定値**を返す。`data-size` に `undefined` が出ると CSS 側で「サイズ指定なし」の分岐を書く羽目になるためである。

入力用と戻り値用で optional の有無が変わるので、型を 2 つに分ける。

```ts
/** 入力コンポーネントが FormField から引き継ぐ状態 */
export type FormFieldControlState = {
  error?: boolean;
  disabled?: boolean;
  /** サイズ。未指定なら FormField の size、それも無ければ 'md' */
  size?: FormFieldSize;
};

/** `useFormFieldState` が返す解決済みの状態。`size` は必ず確定している */
export type FormFieldResolvedState = Omit<FormFieldControlState, 'size'> & {
  size: FormFieldSize;
};

export const useFormFieldState = ({
  error,
  disabled,
  size,
}: FormFieldControlState): FormFieldResolvedState => {
  const context = use(FormFieldContext);

  return {
    error: error ?? toTruthyOrUndefined(context?.state.error),
    disabled: disabled ?? toTruthyOrUndefined(context?.state.disabled),
    // 既定の 'md' はここ 1 か所だけに置く（7 コンポーネントに散らさない）
    size: size ?? context?.state.size ?? 'md',
  };
};
```

`FormFieldControlState` は公開済みの型だが、**optional なプロパティの追加なので非破壊**である。`FormFieldResolvedState` は新規公開。

### 2-3. 入力コンポーネント側

```tsx
export const Input = ({
  startIcon,
  endIcon,
  error: errorProp,
  disabled: disabledProp,
  size: sizeProp,      // ← 既定値は書かない。書くと context より常に優先されてしまう
  className,
  ...props
}: InputProps) => {
  const { error, disabled, size } = useFormFieldState({
    error: errorProp,
    disabled: disabledProp,
    size: sizeProp,
  });
```

**`size: sizeProp = 'md'` と書かないことが要点。** 分割代入で既定値を与えると `undefined` が消え、`FormField` の指定を常に上書きしてしまう。`error` / `disabled` が既定値を持っていないのと同じ理由である。

### 2-4. `FormField.Control` の注入は変えない

`useFormFieldControl` が `cloneElement` で注入するのは `id` / `disabled` / `aria-*` だけ。`size` は独自 prop なので、AGENTS.md の規約どおり **context 経由で伝える**（注入しない）。素の `<input>` を子に置いても壊れない。

## 3. CSS の書き分け規則

サイズで変わる値の置き方を、効く先で決める。

| 値の効く先 | 書き方 |
| --- | --- |
| **子孫のパーツ**（`.input__field` の padding など） | ルートに `--zds-<component>-*` を宣言し、パーツはそれを参照。`[data-size='sm']` では変数だけ差し替える |
| **ルート自身**（`border-radius` / `min-height` など） | `[data-size='sm']` で直接宣言する。変数を噛ませない |

子孫に効く値を子孫セレクタ（`.input[data-size='sm'] .input__field { … }`）で書かないのは、サイズ差分がファイル中に散らばるためである。カスタムプロパティに寄せると、ルートの 2 ブロックを読むだけでサイズ差が分かる。

```css
.input {
  --zds-input-padding-block: var(--spacing-md);

  border-radius: var(--border-radius-lg);
}

.input[data-size='sm'] {
  --zds-input-padding-block: var(--spacing-sm);

  border-radius: var(--border-radius-md);
}

.input__field {
  padding-block: var(--zds-input-padding-block);
}
```

## 4. コンポーネントごとの寸法

`md` 列は現状値そのままで、**変更しない**。

### 4-1. `Input`

| 値 | `md` | `sm` | 変数 |
| --- | --- | --- | --- |
| フィールドの `padding-block` | `--spacing-md`（12px） | `--spacing-sm`（8px） | `--zds-input-padding-block` |
| フィールドの `padding-inline` | `--spacing-sm`（8px） | 据え置き | — |
| `font-size` | `--font-size-base`（16px） | 据え置き（R8） | — |
| `border-radius` | `--border-radius-lg`（8px） | `--border-radius-md`（6px） | 直接宣言 |
| アイコン枠の `padding-inline` | `--spacing-sm`（8px） | 据え置き | — |

高さは 44px → 36px（`padding 8×2 + 行の高さ 18.1 + border 2`）。

### 4-2. `InputNumber`

`Input` と同じ変更に加えて、スピンボタンの列を縮める。

| 値 | `md` | `sm` | 変数 |
| --- | --- | --- | --- |
| フィールドの `padding-block` | `--spacing-md` | `--spacing-sm` | `--zds-input-number-padding-block` |
| スピン列の幅 | 22px | 20px | `--zds-input-number-spin-width`（既存） |
| フィールドの最小幅 | 80px | 64px | `--zds-input-number-field-min-width`（既存） |
| 矢印アイコン | 16px（TSX の定数） | 14px | `--zds-input-number-arrow-size`（新規・6 節） |
| `border-radius` | `--border-radius-lg` | `--border-radius-md` | 直接宣言 |

### 4-3. `TextArea`

ルート要素そのものがフィールドなので、すべて直接宣言する。

| 値 | `md` | `sm` |
| --- | --- | --- |
| `padding` | `--spacing-sm`（8px、全方向） | `--spacing-xs` / `--spacing-sm`（上下 4px・左右 8px） |
| `min-height` | 136px | **104px** |
| `font-size` | `--font-size-base`（16px） | 据え置き（R8） |
| `border-radius` | `--border-radius-lg` | `--border-radius-md` |

`104px` は `md` と同じ導き方で出した値である。`md` の 136px は「Figma の最小コンテンツ 120px（＝ 24px の行 × 5）＋ 上下余白 16px」。`sm` は行 4 つぶん（24px × 4 = 96px）＋ 上下余白 8px で 104px となる。

### 4-4. `Select`

| 値 | `md` | `sm` | 変数 |
| --- | --- | --- | --- |
| フィールドの `padding-block` | `--spacing-md`（12px） | `--spacing-sm`（8px） | `--zds-select-padding-block`（新規） |
| シェブロン | 20px | 16px | `--zds-select-icon-size`（既存） |
| `border-radius` | `--border-radius-lg` | `--border-radius-md` | `--zds-select-border-radius`（新規） |

`padding-inline-end` は `calc(var(--spacing-sm) * 2 + var(--zds-select-icon-size))` のままでよい。アイコンが縮めば右の余白も自動で追従する。

`border-radius` を変数にするのは、枠線を描くのがルート（`.select`）ではなく子の `.select__field` だからである（3 節の規則どおり）。

### 4-5. `Checkbox` / `Radio` / `Switch` — 当たり判定を分離する

`sm` では見た目の箱を 24px より小さくするため、**当たり判定と見た目を別の値に分ける**。これが R7（ポインタターゲット 24×24 px 以上）を満たす仕掛けである。

```css
.checkbox__control {
  /* … */
  align-items: center;      /* ← 追加。小さい箱を当たり判定の中央に置く */
  justify-content: center;  /* ← 追加 */
  width: var(--zds-checkbox-control-size);   /* 当たり判定。常に 24px */
  height: var(--zds-checkbox-control-size);
}

.checkbox__box {
  width: var(--zds-checkbox-box-size);       /* 見た目。sm では 20px */
  height: var(--zds-checkbox-box-size);
}
```

`.checkbox__input` は `position: absolute; inset: 0` で `__control` を覆っているため、**クリック領域は `__control` のサイズになる。** `md` は両方 24px で現状と同じ出力になり、`align-items` / `justify-content` の追加も見た目を変えない。

`Checkbox`：

| 値 | `md` | `sm` | 変数 |
| --- | --- | --- | --- |
| 当たり判定 | 24px | **24px（据え置き）** | `--zds-checkbox-control-size`（新規） |
| 箱の見た目 | 24px | 20px | `--zds-checkbox-box-size`（既存・意味を「見た目」に限定） |
| チェック / マイナスのアイコン | 24px（TSX の定数） | 箱に追従 | 6 節で CSS へ移設 |
| ラベルの `font-size` | `--font-size-base`（16px） | `--font-size-sm`（14px） | `--zds-checkbox-label-font-size`（新規） |
| 箱とラベルの `gap` | `--spacing-sm`（8px） | 据え置き | — |

`Radio`：

| 値 | `md` | `sm` | 変数 |
| --- | --- | --- | --- |
| 当たり判定 | 24px | 24px（据え置き） | `--zds-radio-control-size`（新規） |
| 箱の見た目 | 24px | 20px | `--zds-radio-box-size`（既存） |
| ドット | 10px | 8px | `--zds-radio-dot-size`（既存） |
| ラベルの `font-size` | 16px | 14px | `--zds-radio-label-font-size`（新規） |

`Switch`：

| 値 | `md` | `sm` | 変数 |
| --- | --- | --- | --- |
| 当たり判定の高さ | 24px | **24px（据え置き）** | `--zds-switch-control-height`（新規） |
| トラック | 48×24px | 40×20px | `--zds-switch-track-width` / `-height`（既存） |
| つまみ | 20px | 16px | `--zds-switch-thumb-size`（既存） |
| つまみのインセット | 2px | 据え置き | `--zds-switch-thumb-inset`（既存） |
| ラベルの `font-size` | 16px | 14px | `--zds-switch-label-font-size`（新規） |

つまみの移動量は既存の式（`トラック幅 − つまみ − インセット×2`）がそのまま使える。`sm` は `40 − 16 − 4 = 20px`。

`gap` を 8px のまま据え置くのは、20px の箱に対して 4px だとラベルが接近しすぎるためである。密度はラベルのフォントサイズで作る。

### 4-6. `FormField`

サイズで変わる値をすべてルートのカスタムプロパティに集約する。

```css
.formField {
  --zds-form-field-label-column-width: 100px;
  --zds-form-field-gap: var(--spacing-sm);
  --zds-form-field-label-font-size: var(--font-size-sm);
  --zds-form-field-label-padding-top: var(--spacing-md);
  --zds-form-field-required-badge-padding-inline: var(--spacing-xs);
}

.formField[data-size='sm'] {
  --zds-form-field-label-column-width: 80px;
  --zds-form-field-gap: var(--spacing-xs);
  --zds-form-field-label-padding-top: var(--spacing-sm);
  --zds-form-field-required-badge-padding-inline: var(--spacing-2xs);
}
```

| 箇所 | `md` | `sm` | 意図 |
| --- | --- | --- | --- |
| ルートと `Control` の `gap` | 8px | 4px | 縦の密度 |
| ラベル列の幅 | 100px | 80px | 横幅の密度 |
| ラベルと必須アスタリスクの `font-size` | 14px | **据え置き** | 下記のとおり要件から変更 |
| 横並び時のラベルの `padding-top` | 12px | 8px | 入力欄の `padding-block` に合わせて 1 行目に揃える |
| 必須バッジの `padding-inline` | 4px | 2px | フォントサイズは下げずに幅だけ詰める |
| 必須バッジの `font-size` | 10px | **据え置き** | `--font-size-2xs` が最小段。これ以上下げるトークンが無い |
| 補助テキスト・エラーメッセージ | 12px | **据え置き** | 下記のとおり要件から変更 |

> **要件から変えた点（その 1）。** 要件 R5 では補助テキスト・エラーメッセージも 1 段小さくすると書いたが、1 段下は `--font-size-2xs`（10px）しかない。**エラーメッセージを 10px で出すのは可読性を大きく損なう**ため、12px を維持する。

> **要件から変えた点（その 2）。** 要件ではラベルを 14px → 12px に下げると書いたが、**`sm` でも 14px を維持する。** 12px に下げると `Checkbox` / `Radio` / `Switch` のラベル（`sm` で 14px）より小さくなり、**フィールド全体を名指すラベルが、その中の 1 項目を指すラベルより小さい**という逆転が起きる。補助テキスト（12px）との差も無くなり、階層が色と配置だけになる。
>
> 入力テキスト（16px 据え置き）と補助テキスト（12px 据え置き）に当てた「読める下限は割らない」という基準を、ラベルにも同じく当てる形になる。`sm` の密度は `gap`（8 → 4px）・ラベル列の幅（100 → 80px）・ラベルの `padding-top`（12 → 8px）・入力欄の `padding-block`（12 → 8px）・必須バッジの `padding-inline`（4 → 2px）で十分に出る。
>
> ラベル列の 80px は当初 12px のラベルに合わせた値だが、14px でもそのままとする。折り返しは 12px でも起きており、列幅を戻すと `sm` の横幅の詰まりが薄れるため。

## 5. TSX に残っている寸法を CSS へ移す

サイズが可変になると、TSX の定数と CSS の両方が同じ値を知る状態になり必ず片方が古くなる。AGENTS.md の「CSS と TSX の両方が知る必要のある値は CSS に寄せる」に従って移す。

| 対象 | 現状 | 変更後 |
| --- | --- | --- |
| `Checkbox` の `ICON_SIZE = 24` | `<Icon width={24} height={24} />` | 定数を削除し、`.checkbox__icon` の `width/height: 100%` に任せる（既存の宣言がすでに勝っている） |
| `InputNumber` の `ARROW_SIZE = 16` | `<Icon width={16} height={16} />` | 定数を削除し、`.inputNumber__spinButton > svg { width: var(--zds-input-number-arrow-size) }` を追加 |

どちらも `Icon` が属性で出す `width="24"` は CSS が上書きするため、`Select` のシェブロンとまったく同じ形になる。

## 6. `data-size` の出力位置

`data-*` は状態と常に一致させたいので `{...props}` より後ろに置く（AGENTS.md）。

| コンポーネント | `{...props}` の行き先 | `data-size` の置き場所 |
| --- | --- | --- |
| `Input` / `InputNumber` / `Select` | 内側の `input` / `select` | ラッパー（`{...props}` は届かないので順序の問題は起きない） |
| `Checkbox` / `Radio` / `Switch` | 内側の `input` | ラッパーの `label` |
| `TextArea` | ルートの `textarea` 自身 | **`{...props}` より後ろ** |
| `FormField` | ルートの `div` | `{...props}` より後ろ（既存の `data-orientation` と同じ並び） |

> **ついでに直したい 1 行（確認したい）。** `TextArea` はいま `data-error` を `{...props}` より **前** に置いており、利用側から上書きできてしまう。同じ要素に `data-size` を足すので、`data-error` も後ろへ移して規約に揃えたい。挙動が変わるのは「利用側が `data-error` を明示的に渡していた場合」だけで、通常の使い方には影響しない。

## 7. ファイル別の変更一覧

| ファイル | 変更 |
| --- | --- |
| `src/components/{Checkbox,Input,InputNumber,Radio,Select,Switch,TextArea}/*.tsx` | size 型の定義・公開、prop 追加、`useFormFieldState` へ受け渡し、`data-size` 出力 |
| 同ディレクトリの `*.module.css` | `[data-size='sm']` ブロックと変数の追加 |
| 同ディレクトリの `index.ts` | size 型の再 export |
| `src/components/FormField/FormFieldContext.ts` | `FormFieldSize` / `FormFieldResolvedState` の追加、`state.size`、`useFormFieldState` の解決 |
| `src/components/FormField/FormField.tsx` | `size` prop、context への受け渡し、`data-size` |
| `src/components/FormField/FormField.module.css` | 変数化と `[data-size='sm']` |
| `src/components/FormField/index.ts` | 新しい型の再 export |
| `src/main.tsx` | 8 つの size 型と `FormFieldResolvedState` を公開 |
| `docs/agent-guide.template.md` | size の説明を追記 |

`*.module.css.d.ts` は**クラス名が増えないため変更されない**（追加するのは属性セレクタとカスタムプロパティだけ）。`pnpm check:css-types` で確認する。

## 8. テスト設計

### 8-1. `FormFieldContext.spec.tsx`

`useFormFieldState` の `size` 解決を 3 ケース。

| ケース | 期待 |
| --- | --- |
| context 無し・props 無し | `'md'` |
| context 無し・props に `'sm'` | `'sm'` |
| context が `'sm'`・props 無し | `'sm'` |
| context が `'sm'`・props が `'md'` | `'md'`（props 優先） |

### 8-2. 各コンポーネントの `*.spec.tsx`

7 つとも同じ 4 ケースを足す。判定は `data-size` 属性で行う（クラス名はハッシュ化されるため）。

1. 既定で `data-size="md"`
2. `size="sm"` で `data-size="sm"`
3. `<FormField size="sm">` の中で `data-size="sm"`
4. `<FormField size="sm">` の中でも自身の `size="md"` が勝つ

### 8-3. `FormField.spec.tsx`

- 既定で `data-size="md"`、`size="sm"` で `data-size="sm"`
- 配下の入力要素にも `sm` が伝わる

### 8-4. `pnpm test:a11y`

9 節で足すストーリーがそのまま検査対象になる。ライト / ダーク両配色で `color-contrast` が走るため、ラベルを 14px / 12px に下げたことによるコントラスト不足はここで検出される。

## 9. ストーリー設計

`Card` の `SizeSm` と同じ形で揃える。

- 7 コンポーネントの `*.stories.tsx` に `export const SizeSm: Story = { args: { size: 'sm' } }` を追加
- `meta` の `render` にサイズ比較のセクション（`md` と `sm` を並べる）を追加し、autodocs から一覧で見えるようにする
- `FormField.stories.tsx` に `SizeSm` を追加。**配下に `Input` / `Select` / `Checkbox` を置いたものにして、伝播が効いている状態を実ブラウザの a11y 検査に載せる**

## 10. ドキュメント

`docs/agent-guide.template.md` の「覚えておくこと」に 1 行足す。

> - **フォーム部品の `size` は `FormField` からも配れます。** `<FormField size="sm">` の配下では入力要素とラベルがまとめて `sm` になります。個別に指定すると、そちらが優先されます

公開型の一覧（`{{EXPORTED_TYPES}}`）はソースから差し込まれるため手で書かない。`README.md` はコンポーネントの増減が無いので変更しない。

## 要件との対応

| 要件 | 対応する節 |
| --- | --- |
| R1 対象 7 つに size | 1-3 / 4 |
| R2 固有名の型・ネイティブ `size` を塞ぐ | 1-1 / 1-2 |
| R3 `data-size` + CSS | 3 / 6 |
| R4 `FormField` からの伝播 | 2 |
| R5 `FormField` 自身も追従 | 4-6 |
| R6 既存トークンの範囲 | 4（px 直書きは既存の `--zds-*` 実寸のみ） |
| R7 ターゲット 24×24 px | 4-5（当たり判定と見た目の分離） |
| R8 入力テキスト 16px | 4-1 / 4-3 / 4-4 |
| R9 テスト・ストーリー | 8 / 9 |
| R10 配布物・ガイド | 7 / 10 |

## 確認したい 2 点

1. **`FormField` の補助テキスト・エラーメッセージを `sm` でも 12px のままにしたい**（4-6）。要件では 1 段小さくすると書いたが、1 段下は 10px しか無く、エラーメッセージとしては小さすぎる
2. **`TextArea` の `data-error` を `{...props}` の後ろへ移したい**（6）。規約に揃えるための 1 行の変更
