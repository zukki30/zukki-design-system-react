# 要件: フォーム系コンポーネントに size prop を追加する

対象 Issue: [#108 Form の component にも size props をつける](https://github.com/zukki30/zukki-design-system-react/issues/108)

## Issue の指示

> Checkbox, Input, InptNumber, Radio, Select, Switch, TextArea などにも size props をつけて調整できるようにする

## 事前に確認した方針

要件を書く前に 3 点を確認した。以降の記述はこの回答を前提にしている。

| 論点 | 決定 |
| --- | --- |
| size の段階 | **`sm` / `md` の 2 段階**。`Button` / `IconButton` と揃える |
| `FormField` からの伝播 | **伝播する。ラベル・補助テキストなど `FormField` 自身のパーツも追従させる** |
| `sm` の寸法 | **既存トークンの範囲でこちらから提案し、設計フェーズで確認してもらう** |

## 現状（実測値）

`origin/main`（`cc11173`）のソースを読んで確認した事実である。

### A. size を持つのは 2 コンポーネントだけ

`src/components/` は 19 ディレクトリ。`size` prop を持つのは次の 3 つで、フォーム系は 1 つも無い。

| コンポーネント | 型 | 出し分け |
| --- | --- | --- |
| `Button` | `ButtonSize = Exclude<SizeType, 'lg'>` | `data-size` → CSS |
| `IconButton` | `IconButtonSize = Exclude<SizeType, 'lg'>` | `data-size` → CSS |
| `Card` | `CardSize = 'md' \| 'sm'` | `data-size` → CSS（値はカスタムプロパティで継承） |

対象 7 コンポーネントのうち `Checkbox` / `Radio` / `Switch` は、ネイティブの `size` 属性が誤って渡らないよう `Omit<ComponentPropsWithRef<'input'>, … 'size'>` で**すでに `size` を塞いでいる**。名前の衝突は起きない。

`Input` / `InputNumber` / `Select` / `TextArea` は `size` を塞いでいないため、現在は HTML の `size` 属性（`input` は表示文字数、`select` は表示行数）がそのまま通っている。ここに独自の `size` を足すと**意味が変わる**。この扱いは要件 R2 で決める。

### B. 対象 7 コンポーネントの現在の寸法

すべて「1 サイズ固定」で、下表の値がそのまま新しい `md` になる（見た目を変えない）。

| コンポーネント | 高さを決める値 | テキスト | 付属パーツ |
| --- | --- | --- | --- |
| `Input` | `padding-block: 12px` / `padding-inline: 8px`、border 1px、radius 8px | `font-size: 16px` / `line-height-line` | アイコン枠 `padding-inline: 8px` |
| `InputNumber` | `Input` と同じ | `16px`、`font-family-number`、`tabular-nums` | スピン列 22px、フィールド最小幅 80px |
| `TextArea` | `padding: 8px`（全方向）、radius 8px | `16px` / `line-height-default` | `min-height: 136px` |
| `Select` | `padding-block: 12px`、`padding-inline-start: 8px`、`padding-inline-end: calc(8px * 2 + 20px)` | `16px` / `line-height-line` | シェブロン 20px（`--zds-select-icon-size`） |
| `Checkbox` | — | ラベル `16px`、`padding-block: 2px` | 箱 24px（`--zds-checkbox-box-size`）、アイコン 24px、gap 8px |
| `Radio` | — | ラベル `16px` | 箱 24px、ドット 10px、gap 8px |
| `Switch` | — | ラベル `16px` | トラック 48×24px、つまみ 20px、インセット 2px、gap 8px |

`FormField` 側の現在値。

| 箇所 | 値 |
| --- | --- |
| ルートの `gap` | 8px |
| ラベル列の幅 | 100px（`--zds-form-field-label-column-width`） |
| ラベル | `font-size: 14px` / `line-height-heading`、横並び時 `padding-top: 12px` |
| 必須バッジ | `font-size: 10px`、`padding-inline: 4px` / `padding-block: 2px` |
| 補助テキスト・エラーメッセージ | `font-size: 12px` |

### C. `FormField` が状態を配る仕組み

`FormFieldContext.ts` に 2 つのフックがある。

- `useFormFieldContext()` — パーツ用。`<FormField>` の外で呼ぶと例外を投げる
- `useFormFieldState({ error, disabled })` — 入力コンポーネント用。**自身の props を優先し、未指定のときだけ context の値を使う。context が無ければ props をそのまま返す**（単体でも使えるように例外を投げない）

対象 7 コンポーネントはすべて `useFormFieldState` を呼んでいる。`size` もこの経路に載せれば、伝播の規則は `error` / `disabled` とまったく同じになる。

戻り値の型 `FormFieldControlState` は `src/main.tsx` から公開済みで、入力用と戻り値用を兼ねている。

### D. `Button` の `sm` / `md` の対比（`sm` を決めるときの参考）

| 箇所 | `sm` | `md` | 差 |
| --- | --- | --- | --- |
| `padding-inline` | `2xl`（24px） | `3xl`（32px） | トークン 1 段 |
| ラベルの `padding-block` | `lg` / `md`（14 / 12px） | `xl` / `lg`（16 / 14px） | トークン 1 段 |
| `font-size` | `xs`（12px） | `sm`（14px） | トークン 1 段 |
| `border-radius` | `sm`（4px） | `md`（6px） | トークン 1 段 |

`sm` は「各値をトークン 1 段ぶん小さくしたもの」として定義されている。フォーム系もこの考え方を踏襲する。

## 要件

### R1. 対象コンポーネントに `size` を追加する

`Checkbox` / `Input` / `InputNumber` / `Radio` / `Select` / `Switch` / `TextArea` の 7 つに `size?: 'sm' | 'md'` を追加する。

- 既定は `'md'`
- **既定値のときの見た目は現在と 1px も変えない。** 既存の利用側にとって非破壊であること

### R2. 型はコンポーネント固有の名前で公開する

`CheckboxSize` / `InputSize` / `InputNumberSize` / `RadioSize` / `SelectSize` / `SwitchSize` / `TextAreaSize` / `FormFieldSize` を `src/main.tsx` から公開する。実体は `Exclude<SizeType, 'lg'>`。`SizeType` は引き続き非公開とする。

`Input` / `InputNumber` / `Select` / `TextArea` については、独自の `size` が HTML の `size` 属性を置き換えることになる。**ネイティブの `size` 属性は `Omit` で塞ぐ**（`Checkbox` / `Radio` / `Switch` がすでにそうしている形に揃える）。

- `input` の `size`（表示文字数）と `select` の `size`（表示行数）は、いずれも幅・高さを CSS で決めている本ライブラリでは効かないか、レイアウトを壊す
- 現状これらを渡しているコードがあれば型エラーになる。**この 1 点だけは破壊的変更**にあたるため、PR に明記する

### R3. 見た目の出し分けは `data-size` + CSS で行う

ルート要素に `data-size` を出力し、CSS 側で `[data-size='sm']` を書く。TSX に寸法の数値を持たせない。`data-size` は利用側の `{...props}` より**後**に指定して上書きさせない。

`Card` のような入れ子は起きないため、`Card` で必要だった「カスタムプロパティで配る」形は必須ではない。ただし 1 つの値が複数の宣言から参照される箇所（`Select` のシェブロン幅、`Switch` のつまみ移動量など）は、既存どおり `--zds-<component>-` 接頭辞のカスタムプロパティで持ち、`[data-size='sm']` 側で値だけ差し替える。

### R4. `FormField` から配下へ伝播させる

`FormField` に `size?: FormFieldSize`（既定 `'md'`）を追加し、context の `state.size` として配る。

入力コンポーネント側の解決規則は `error` / `disabled` と同じにする。

1. 自身の `size` prop があればそれを使う
2. 無ければ `FormField` の `size` を使う
3. `FormField` の外なら `'md'`

`useFormFieldState` の戻り値に `size` を足す。`error` / `disabled` は「未指定なら `undefined`」を返しているが、`size` は**常に確定した値**（`'sm'` か `'md'`）を返す。`data-size` に `undefined` を出すとサイズ指定の無い要素になり、CSS 側で既定を書き分ける必要が生じるためである。

### R5. `FormField` 自身のパーツも size に追従する

`size='sm'` のとき、次を 1 段ずつ小さくする。

- ラベルのフォントサイズと、横並び時の `padding-top`（入力欄の上下パディングに合わせて下げている値なので、入力欄が縮めば追従が必要）
- 必須バッジ・必須アスタリスク
- 補助テキスト・エラーメッセージのフォントサイズ
- ルートの `gap`、`FormField.Control` の `gap`
- ラベル列の幅（`--zds-form-field-label-column-width`）

### R6. 値は既存トークンの範囲で表す

`sm` の寸法は `--spacing-*` / `--font-size-*` / `--border-radius-*` から選ぶ。px の直書きは、既存の `--zds-*` カスタムプロパティ（箱 24px、トラック 48×24px など、トークンに無い実寸）と同じ扱いに限る。

Figma のトークン（`figma/tokens.json`）は変更しない。

### R7. `sm` でもポインタターゲットを 24×24 px 未満にしない

WCAG 2.2 の 2.5.8 Target Size (Minimum) を下回らせない。特に `Checkbox` / `Radio` はラベルを持たない使い方（テーブルの行選択など）ができるため、**箱そのもののクリック領域**で 24px を確保する。

`Switch` はトラックが 48×24px なので縮めても幅は足りるが、高さは 24px を下回らせない。

### R8. `sm` でも入力テキストのフォントサイズを 16px 未満にしない

iOS Safari は、フォーカス時のフォントサイズが 16px 未満の入力欄でページを自動ズームする。対応ブラウザに iOS Safari が入っているため、**`Input` / `InputNumber` / `TextArea` / `Select` の入力テキストは `sm` でも 16px（`--font-size-base`）を保つ**。

`sm` の密度は余白・付属パーツ・`FormField` 側のテキストで作る。

> **確認したい点。** これを崩す（`sm` で 14px にする）とモバイルでズームが起きる。代わりに `@media (pointer: coarse)` で粗いポインタのときだけ 16px へ戻す手もあるが、同じコンポーネントが環境で違う見た目になるため推奨しない。上記のまま進めてよいか確認したい。

`Checkbox` / `Radio` / `Switch` の**ラベル**は入力欄ではないため、この制約の対象外とする（縮めてよい）。

### R9. テストとストーリー

- 各コンポーネントの `*.spec.tsx` に、既定が `md` であること・`sm` を指定できること・`FormField` から継承すること・自身の props が context より優先されることのテストを足す
- 各コンポーネントの `*.stories.tsx` に `sm` / `md` を並べたストーリーを足す。`pnpm test:a11y` はストーリーを実ブラウザで描画するため、これがライト・ダーク両配色での検証を兼ねる
- `FormFieldContext.spec.tsx` に `useFormFieldState` の `size` 解決のテストを足す

### R10. 配布物と利用側向けの情報

- 新しい型を `src/main.tsx` から公開し、`pnpm verify:dist` を通す
- `docs/agent-guide.template.md` に、フォーム部品の `size` と「`FormField` の `size` は子へ伝わる」ことを追記する（現在は `disabled` とエラー状態しか書かれていない）。公開型の一覧はソースから差し込まれるため手で書き写さない
- `README.md` のコンポーネント一覧は増減が無いため変更しない

## 提案する `sm` の値

設計フェーズで確定させるが、方向性を先に示す。トークン 1 段ぶん小さくするのが基本方針である。

| 箇所 | `md`（現状） | `sm`（提案） |
| --- | --- | --- |
| `Input` / `InputNumber` / `Select` の `padding-block` | `md`（12px） | `sm`（8px） |
| `TextArea` の `padding` | `sm`（8px） | `xs`（4px）＋左右は `sm` 維持 |
| `TextArea` の `min-height` | 136px | 96px 前後 |
| 入力テキストの `font-size` | `base`（16px） | **`base`（16px）のまま**（R8） |
| `border-radius` | `lg`（8px） | `md`（6px） |
| `Checkbox` / `Radio` の箱 | 24px | 20px（クリック領域は 24px を維持。R7） |
| `Radio` のドット | 10px | 8px |
| `Switch` のトラック | 48×24px | 40×24px（高さは維持。R7） |
| ラベルの `font-size`（`Checkbox` / `Radio` / `Switch`） | `base`（16px） | `sm`（14px） |
| `FormField` のラベル | `sm`（14px） | `xs`（12px） |
| `FormField` の補助・エラーテキスト | `xs`（12px） | `2xs`（10px） |
| `FormField` のラベル列幅 | 100px | 80px |

## 非対象

- `lg` の追加。`Button` / `IconButton` に `lg` が無く、隣に並べたときに対応する段が無くなるため
- `Button` / `IconButton` / `Card` の size 段階の変更
- `FormField` 以外の親（`Card` など）からのサイズ伝播
- Figma トークンの再生成
- 対象 7 コンポーネント以外への size 追加

## 受け入れ条件

1. 対象 7 コンポーネントと `FormField` が `size` を受け取り、`sm` / `md` で見た目が変わる
2. `size` 未指定時のレンダリング結果（クラス・スタイル）が変更前と一致する
3. `<FormField size="sm">` の配下で、入力要素とラベル・補助テキストがまとめて `sm` になる
4. 入力要素側で `size` を明示すると、`FormField` の指定より優先される
5. `pnpm lint:check` / `pnpm format:check` / `pnpm typecheck` / `pnpm test` / `pnpm test:a11y` / `pnpm verify:dist` がすべて通る
6. `sm` のポインタターゲットが 24×24 px 以上（R7）、入力テキストが 16px（R8）
