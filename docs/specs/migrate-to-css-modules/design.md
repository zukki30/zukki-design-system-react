# 設計: スタイリングを Vanilla Extract から CSS Modules へ移行する

対象 Issue: [#84](https://github.com/zukki30/zukki-design-system-react/issues/84)
前提: [requirements.md](./requirements.md)

## 1. 全体像

移行の核は「**`vars` オブジェクトを経由したハッシュ変数への参照を、意味的な CSS 変数への直接参照に置き換える**」ことである。これに伴って記述方式が `.css.ts` から `.module.css` へ変わり、CSS 変数の生成経路が 1 本になる。

```
【移行前】
figma/tokens.json
  ├→ style-dictionary ─→ src/design-tokens/*.ts ─→ createGlobalTheme ─→ :root { --_hash: … }  ← コンポーネントが参照
  └→ style-dictionary ─→ src/styles/variables.css ────────────────────→ :root { --color-…: … }  ← 誰も参照しない
                        src/styles/variables-{light,dark}-only.css ───→ 未使用

【移行後】
figma/tokens.json
  └→ style-dictionary ─→ src/styles/variables.css ────────────────────→ :root { --color-…: … }  ← コンポーネントが参照
                        src/styles/variables-{light,dark}-only.css ───→ 配布 CSS の固定版に使う
```

## 2. CSS 変数の参照規則

### 2.1 変換規則

`vars` のパスから CSS 変数名への変換は、次の規則で **完全に機械的** である。

1. パスの各セグメントを camelCase → kebab-case に変換する
2. `&` を除去し、空白を `-` に置換する
3. `-` で連結し、連続する `-` を 1 つにまとめ、全体を小文字にする
4. 先頭に `--` を付ける

| `vars` のパス | CSS 変数 |
| --- | --- |
| `vars.color.primary.default` | `--color-primary-default` |
| `vars.color.textOnLight.default` | `--color-text-on-light-default` |
| `vars.color.input.border['error hover']` | `--color-input-border-error-hover` |
| `vars.color['checkbox & radio'].icon.checked` | `--color-checkbox-radio-icon-checked` |
| `vars['border-radius'].sm` | `--border-radius-sm` |
| `vars.spacing['2xl']` | `--spacing-2xl` |
| `vars.color.grey[200]` | `--color-grey-200` |
| `vars.Elevation.Styles.elevation4.y` | `--elevation-styles-elevation4-y` |

### 2.2 検証結果

この規則が全トークンで成立することを、`src/design-tokens/*.ts` の葉 312 個と `src/styles/variables.css` の宣言 312 個を突き合わせて確認した。

```
leaves=312 declared=312
--- CSS に無い (0) ---
--- TS に無い (0) ---
--- 値が違う (4) ---
--elevation-styles-elevation2-color:  css=rgba(0, 0, 0, 0.15) / ts=#00000026
--elevation-styles-elevation4-color:  css=rgba(0, 0, 0, 0.15) / ts=#00000026
--elevation-styles-elevation8-color:  css=rgba(0, 0, 0, 0.15) / ts=#00000026
--elevation-styles-elevation12-color: css=rgba(0, 0, 0, 0.25) / ts=#00000040
```

**過不足はゼロ**。値が違う 4 件は elevation の影色で、`rgba(0, 0, 0, 0.15)` と `#00000026` は同じ色の別表記である（`0x26 / 0xff ≒ 0.149`）。style-dictionary の `color/css` トランスフォームが CSS 側だけに掛かっているために表記が分かれている。

実際に参照しているのは `Tooltip`（elevation2）と `Dialog`（elevation4）の `box-shadow` のみで、描画結果は変わらない。elevation8 / elevation12 は未使用。

## 3. ファイル構成

### 3.1 追加・変更・削除

| 操作 | パス | 備考 |
| --- | --- | --- |
| 追加 | `src/components/*/ComponentName.module.css` | 19 枚。`.css.ts` と 1 対 1 |
| 追加 | `src/components/*/ComponentName.module.css.d.ts` | 生成物。コミットする |
| 追加 | `src/styles/mixins.module.css` | `composes:` 用の共有クラス |
| 追加 | `src/styles/mixins.module.css.d.ts` | 生成物 |
| 追加 | `scripts/build-css-module-types.ts` | `.d.ts` 生成スクリプト |
| 追加 | `.storybook/preview.css` | 素の CSS |
| 削除 | `src/components/*/ComponentName.css.ts` | 19 枚 |
| 削除 | `src/styles/theme.css.ts` | `createGlobalTheme` |
| 削除 | `src/styles/{colorScheme,interactive,motion,text}.ts` とその `.spec.ts` | 計 8 枚 |
| 削除 | `.storybook/preview.css.ts` | |
| 変更 | `src/components/*/ComponentName.tsx` | import 形式・`data-*` 付与 |
| 変更 | `vite.config.ts` | `vanillaExtractPlugin()` を外す |
| 変更 | `scripts/build-css-variants.ts` | 固定版の作り方を変える |
| 変更 | `style-dictionary/utils.ts` | 固定版の変数ファイルに `color-scheme` を入れる |
| 変更 | `src/styles/variables-{light,dark}-only.css` | 上記の再生成結果 |
| 変更 | `package.json` | 依存とスクリプト |
| 変更 | `.storybook/preview.tsx` | `variables.css` を読む |
| 変更 | `AGENTS.md` / `README.md` | 規約とスタックの記述 |

### 3.2 コンポーネントのレイアウト

`.css.ts` が `.module.css` に置き換わり、生成された `.d.ts` が隣に並ぶ。それ以外は変えない。

```
ComponentName/
├── hooks/
├── ComponentName.tsx
├── ComponentName.stories.tsx
├── ComponentName.module.css          # ← 旧 ComponentName.css.ts
├── ComponentName.module.css.d.ts     # ← 生成物。手編集しない
└── index.ts
```

## 4. 記述パターンの変換

### 4.1 クラス命名

BEM を使う。ブロック名はコンポーネント名の camelCase、要素は `__` で継ぐ。**修飾子クラス（`--`）は使わず、`data-*` 属性で表す**（決定事項 D1）。

| 旧 export 名 | 新クラス名 | TSX からの参照 |
| --- | --- | --- |
| `button` | `.button` | `styles.button` |
| `buttonInner` | `.button__inner` | `styles.button__inner` |
| `buttonLabel` | `.button__label` | `styles.button__label` |
| `iconButtonIcon` | `.iconButton__icon` | `styles.iconButton__icon` |

`__` を含む名前は JavaScript の識別子として妥当なので、ブラケット記法を使わずドットで参照できる。`-` を含む名前を作らないのはこのためである。

### 4.2 変換表

| Vanilla Extract | CSS Modules |
| --- | --- |
| `style({ color: … })` | `.block { color: …; }` |
| `styleVariants({ primary: {…} })` | `.block[data-variant='primary'] { … }` |
| `style([base, {…}])` | `composes: base;`（同一ファイル内） |
| `styleVariants({ sm: [base, {…}] })` | base を `.block` 本体に置き、差分だけ `[data-size='sm']` に書く |
| `selectors: { '&:hover': {…} }` | `.block:hover { … }` |
| `` selectors: { [`${other} &`]: {…} } `` | `.other .block { … }` |
| `'::after': {…}` | `.block::after { … }` |
| `'@media': { [q]: {…} }` | ルール内にネストした `@media (…) { … }` |
| `keyframes({ '0%': {…} })` | `@keyframes name { 0% { … } }` |
| `` globalStyle(`${selectField} option`, {…}) `` | `.select__field option { … }` |
| `vars.a.b.c` | `var(--a-b-c)` |

`globalStyle` が要らなくなるのは、CSS Modules が **クラスセレクタだけをスコープし、要素セレクタはそのまま残す** ためである。`option` は素の要素セレクタとして書ける。

`@keyframes` の名前は CSS Modules がスコープするため、`animation` の値に書いた名前も自動で書き換わる。グローバルに漏れない点は `keyframes()` と同じ。

### 4.3 バリアントの `data-*` 属性名

既存の `data-*` と衝突しない名前を使う。ルート要素に付け、パーツ側は親セレクタから引く。

| コンポーネント | 追加する属性 | 置き換わる `styleVariants` |
| --- | --- | --- |
| `Button` | `data-variant` / `data-size` | `buttonVariant` / `buttonSize` / `buttonLabel` |
| `IconButton` | `data-variant` / `data-size` | `iconButtonVariant` / `iconButtonSize` |
| `Tag` | `data-variant` | `tagVariant` / `tagCloseButtonVariant` |
| `Spinner` | `data-variant` | `spinnerVariant` |
| `Card` | `data-size` | `cardHeader` / `cardBody` / `cardFooter` |
| `Steps` | `data-orientation`（既存） | `steps` |
| `StepsItem` | `data-status` | `stepsItemIcon` / `stepsItemLabel` |
| `Breadcrumb` | `data-current` | `breadcrumbCurrent` |

`Card` は `data-size` をルート（`Card`）に付け、パーツ側は `.card[data-size='sm'] .card__header` の形で引く。現在は各パーツが個別に `cardHeader[size]` を受け取っているが、`size` は context 経由でパーツに配られているため、ルートに 1 つ置けば足りる。

### 4.4 数値リテラルの単位

Vanilla Extract は長さプロパティの数値に `px` を自動で付ける。素の CSS では付かないため、**単位を明示する**。

移行対象は次のとおり（`0` と単位なしプロパティは対象外）。

| 値 | 箇所 |
| --- | --- |
| `borderWidth: 1` → `1px` | Button / Card / Checkbox / Dialog / Input / InputNumber / Radio / Select / StepsItem / Tag / TextArea |
| `borderInlineStartWidth: 1` → `1px` | InputNumber |
| `strokeWidth: 2` → `2px` | Spinner（`stroke-width` にも `px` が付いている。ビルド済み CSS で確認済み） |
| `maxWidth: 240` → `240px` | Tooltip |
| `width: 1` / `height: 1` / `margin: -1` | StepsItem / InputNumber |
| `height: 20` → `20px` | StepsItem |

`flexShrink` / `flex` / `lineHeight` / `opacity` / `zIndex` / `gridColumn` は単位なしのまま。

### 4.5 ファイルローカルな定数

`.css.ts` の中で `const BOX_SIZE = 24` のように置いていた定数は、**ブロッククラスに宣言したカスタムプロパティ** に移す。名前は利用側と衝突しないよう `--zds-<component>-` を前置する。

```css
.switch__track {
  --zds-switch-track-width: 48px;
  --zds-switch-thumb-size: 20px;
  --zds-switch-thumb-inset: 2px;

  width: var(--zds-switch-track-width);
}

.switch__thumb {
  /* THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - THUMB_INSET * 2 */
  translate: calc(
    var(--zds-switch-track-width) - var(--zds-switch-thumb-size) -
      var(--zds-switch-thumb-inset) * 2
  );
}
```

対象は `Radio`（`BOX_SIZE` / `DOT_SIZE`）・`Checkbox`（`BOX_SIZE`）・`Switch`（4 つ）・`InputNumber`（`SPIN_WIDTH` / `FIELD_MIN_WIDTH`）・`Select`（`ICON_SIZE`）・`FormField`（`LABEL_COLUMN_WIDTH`）・`StepsItem`（`ICON_SIZE` / `STEP_ITEM_BAR_MIN_SIZE`）・`TextArea`（`MIN_HEIGHT`）・`Tag`（閉じるボタンのサイズ 2 つ）。

導出が無く 1 箇所でしか使わない定数は、コメント付きのリテラルでよい。

### 4.6 `Tag.css.ts` の `CLOSE_BUTTON_SIZE`

`.css.ts` から値を export しているのはここだけで、`Tag.tsx` が `<Icon width={14} height={14}>` に渡している。TSX と CSS の両方に 14 を持たせると必ず片方が古くなるため、**サイズの持ち主を CSS に一本化** する。

```tsx
<button className={styles.tag__closeButton}>
  <Icon name="close" />
</button>
```
```css
.tag__closeButton {
  width: 14px;
  height: 14px;
}
/* Icon は width/height 属性で 24 を出すが、CSS の指定が優先される */
.tag__closeButton > svg {
  width: 100%;
  height: 100%;
}
```

DOM 上は `width="24"` 属性が残るが、計算後のサイズは 14px で変わらない。

## 5. 共有 mixin

### 5.1 `composes:` で引く 3 つ

`src/styles/mixins.module.css` に置く。JSDoc に書かれていた「なぜそうするか」は CSS コメントへ引き継ぐ。

```css
/* 入力系を UA 描画のパーツごとライト配色に固定する。… */
.inputColorSchemeLight {
  color-scheme: light;
}

/* インタラクティブ要素のタッチ操作最適化。… */
.interactiveTouch {
  touch-action: manipulation;
  -webkit-tap-highlight-color: transparent;
}

/* 1 行に収め、あふれたぶんを省略記号で示す。… */
.truncate {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
```

使う側はエイリアス付きのパスで引ける（Vite で解決を確認済み）。

```css
.tag__label {
  composes: truncate from '@/styles/mixins.module.css';
}
```

`composes` した側の JS 値はクラス名 2 つの文字列（`"_tag__label_x _truncate_y"`）になる。`clsx()` に渡しても `toHaveClass()` に渡しても正しく扱われる。

出力順は「`mixins.module.css` が先、コンポーネントが後」になるため、万一宣言がぶつかってもコンポーネント側が勝つ。ただし 3 つとも衝突しない宣言だけを持たせる方針は維持する。

### 5.2 `reducedMotion` は直書きする

`reducedMotion` を `composes:` にすると、`@media` 内の `transition: none` とコンポーネントの `transition` が **別クラスの宣言** になり、勝敗がスタイルシートの出力順に依存してしまう。現在の実装が「同一ルール内に展開されるため順序に依存しない」ことを設計上の要点にしているので、その性質を保つ。

```css
.button {
  transition:
    background-color 0.2s ease-in-out,
    border-color 0.2s ease-in-out,
    color 0.2s ease-in-out;

  /* 同一ルール内なので、出力順によらずベース宣言を上書きできる */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    animation: none;
  }
}
```

ネストした `@media` が `build.cssTarget`（chrome123 / safari17.5 / firefox120）でネストのまま保持されることは、実ビルドで確認済み。

## 6. クラス名の型生成

### 6.1 生成方式

`scripts/build-css-module-types.ts` を追加する。**Vite の `css.modules.getJSON` フックからクラス名を受け取る** ため、新しい依存は要らず、実際のビルドと同じ解決結果になる（`composes` の扱いも含めて一致する）。

```ts
await build({
  configFile: false,
  css: { modules: { getJSON: (file, json) => collected.set(file, Object.keys(json)) } },
  build: { write: false, lib: { entry /* 全 .module.css を import する一時ファイル */ } },
});
```

正規表現でクラス名を掻き集める方式は採らない。`url()` や `content` の中身を拾ってしまい、失敗しても「クラスが 1 つ足りない `.d.ts`」が静かに出来上がるためである。

### 6.2 出力形式

```ts
// このファイルは自動生成されています。直接編集しないでください。
declare const styles: {
  readonly button: string;
  readonly button__inner: string;
  readonly button__label: string;
  readonly button__loading: string;
};
export default styles;
```

`X.module.css.d.ts` という名前にする。TypeScript 6 がこの形式を **コンパイラオプションなしで** 解決し、`vite/client` の索引シグネチャより優先することを実測で確認した。TypeScript 5.0 以降の `X.module.d.css.ts` 形式は `allowArbitraryExtensions: true` を要するため採らない。

存在しないクラス名を参照すると型エラーになる。

### 6.3 コマンドと CI

| コマンド | 動作 |
| --- | --- |
| `pnpm build:css-types` | 生成して書き出す |
| `pnpm build:css-types --check` | 生成結果と既存ファイルを比べ、差があれば異常終了する |

生成物はコミットする（`src/design-tokens/*` と同じ扱い）。エディタが追加のビルドなしで型を引けるようにするためである。

CI には `build:css-types --check` を足す。`build` と `typecheck` の前段で生成すると、古いまま commit されても CI が通ってしまうため、**生成は build に組み込み、鮮度は `--check` で見る**。

出力は Prettier のルールに合わせて生成する（`{src,scripts}/**/*.ts` が `format:check` の対象に入るため）。

## 7. ビルド

### 7.1 `vite.config.ts`

`vanillaExtractPlugin()` を外すだけ。`cssTarget` / `lib` / `rollupOptions.external` は変えない。

CSS Modules の `generateScopedName` は設定しない。Vite 既定の `_[local]_[hash]_[line]`（例: `_button_13ios_1`）で、DevTools で読める名前が付く。ハッシュが入るため利用側との衝突は起きない。

### 7.2 配布 CSS 3 種類の作り方

現在は `dist/zukki-design-system.css` の `light-dark()` を自作パーサで解決している。移行後は **`:root` ルールを差し替える** 方式にする。

```
dist/zukki-design-system.css   = variables.css（:root）+ 全コンポーネントのスタイル
        │
        ├─ styles.css       … そのままリネーム
        ├─ styles-light.css … :root ルールを全部落として variables-light-only.css を前置
        └─ styles-dark.css  … :root ルールを全部落として variables-dark-only.css を前置
```

コンポーネント側は `:root` を一切使わないため、「`:root { … }` を全部落とす」で変数定義だけを正確に切り離せる。80 行の `light-dark()` パーサは不要になり、`resolveLightDark()` を削除できる。

`src/main.tsx` の `import './styles/variables.css'` は残す。これが `dist/styles.css` の `:root` の出どころになる。

### 7.3 `variables-{light,dark}-only.css` に `color-scheme` を入れる

固定版は `color-scheme` も固定していないと、UA が描画する部分だけ OS 設定に従ってしまう（`verify:dist` が検査している）。現在の生成物には `color-scheme` が入っていないため、`style-dictionary/utils.ts` の出力フォーマットを変える。

```css
:root {
  color-scheme: light;
}

:root {
  --color-focus: #0e70f1;
  …
}
```

`build-css-variants.ts` 側で文字列を前置する手もあるが、生成物のほうを自己完結させる。`src/styles/variables-light-only.css` を単体で読めば「ライト固定の変数一式」がそろう、という意味が明確になる。

### 7.4 `src/main.tsx` の design-tokens 読み込み

```ts
import './design-tokens/dark';
import './design-tokens/light';
import './design-tokens/light-dark';
import './design-tokens/token';
import './design-tokens/typography';
```

この 5 行は `const` を宣言するだけのモジュールへの副作用 import で、実際には何も起きていない。`createGlobalTheme` の廃止で参照者がいなくなるため削除する（§10 も参照）。

## 8. Storybook

### 8.1 変数の読み込み

**現在 Storybook は `variables.css` を読んでいない。** 値はすべて `theme.css.ts` のハッシュ変数から来ており、`.css.ts` を経由して各ストーリーに載っている。移行後は意味的な変数が必要になるため、`preview.tsx` で明示的に読む。

```tsx
import '../src/styles/variables.css';
import './preview.css';
```

Issue の「storybook は variables.css を使用して切り替え」はこの経路を指している。

### 8.2 `preview.css`

`preview.css.ts` を素の CSS に置き換える。CSS Modules ではないので `.storybook/preview.css`（`.module` を付けない）とし、グローバルセレクタをそのまま書ける。

```css
/* 配色は preview.tsx の decorator が theme グローバルに応じて付け替える。… */
.light-theme {
  color-scheme: light;
}

.dark-theme {
  color-scheme: dark;
}

/* キャンバスにページ面のトークンを当てる。… */
body {
  background-color: var(--color-surface-page);
  color: var(--color-text-on-surface-default);
}
```

`preview.tsx` の decorator（`light-theme` / `dark-theme` の付け替え）と `globalTypes` は変えない。ツールバー操作とテストの `initialGlobals` が同じ経路を通る性質も維持される。

## 9. テスト

### 9.1 クラス名を import している spec

5 ファイルが `*.css` からクラス名を import している。default import に変える。

```ts
// 変更前
import { buttonLoading } from './Button.css';
// 変更後
import styles from './Button.module.css';
//   … styles.button__loading
```

`vitest.config.ts` の `unit` プロジェクトは `css: true` なので、jsdom でも CSS Modules が処理されスコープ済みのクラス名が返る。設定変更は不要。

### 9.2 `Steps.spec.tsx` の `vars` 参照

`getComputedStyle(el).fontWeight` を `vars['font-weight'].bold` と比較している。jsdom は `var(…)` を解決せず文字列のまま返すため、比較対象を CSS 変数の参照文字列に置き換える。

```ts
expect(getComputedStyle(current).fontWeight).toBe('var(--font-weight-bold)');
```

### 9.3 `vars` を使うストーリー 2 本

`Card.stories.tsx` / `Spinner.stories.tsx` のインラインスタイルを `var(--color-…)` の文字列にする。

```tsx
const moreLinkStyle = { color: 'var(--color-text-on-link-default)', … };
```

### 9.4 `src/styles/*.spec.ts` 4 本

`colorScheme` / `interactive` / `motion` / `text` の mixin が CSS へ移るため、対象の関数が無くなる。spec ごと削除する。CSS そのものの検査は `pnpm test:a11y` と §11 の突き合わせが担う。

## 10. `src/design-tokens/` の扱い

`createGlobalTheme` を廃止すると、`src/design-tokens/*.ts`（27KB / 5 ファイル）の参照者がゼロになる。`src/main.tsx` からも export していないため、公開 API への影響は無い。

**削除する。**

- `src/design-tokens/` 5 ファイル、`style-dictionary/build-css-variables-ts-object.ts`、`package.json` の `build:tokens:ts-object` を削除する
- `pnpm build:tokens` は CSS だけを生成するようになり、AGENTS.md のパイプライン記述も 1 段短くなる
- トークンの正は `figma/tokens.json` → `variables*.css` の 1 本になる

「生成物だが誰も参照していない」状態を残すと、いま `variables-*-only.css` で起きているのと同じことになる。

## 11. 描画結果を変えていないことの検証

R5-1（描画結果を変えない）が本移行の最大のリスクである。2,177 行を手で書き換えるため、目視とレビューだけでは取りこぼす。

ビルド済み CSS の差分では確認できない。クラス名も変数名もハッシュで、移行前後で対応が付かないためである。そこで **実ブラウザでの計算後スタイルを突き合わせる**。

### 11.1 手順

`docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts` を置く（`pnpm` スクリプトには載せない一度きりの道具）。

1. `pnpm build-storybook` で静的ビルドを作り、ローカルで配信する
2. `index.json` から全ストーリー（104 本）の id を取る
3. 各ストーリーを `iframe.html?id=<id>&globals=theme:light` / `theme:dark` で開く（計 208 回）
4. 描画された DOM を歩き、要素ごとに `getComputedStyle` を読む。対象プロパティは、ビルド済み CSS に実際に現れるものだけに絞る
5. 「要素パス → プロパティ → 値」の JSON を `.tmp/` に書き出す

移行前（`main`）と移行後で 1 回ずつ実行し、差分を取る。**差分ゼロが移行完了の条件** とする。

Playwright は `@vitest/browser-playwright` の依存としてすでに入っており、Chromium も導入済みであることを確認した。

### 11.2 この方法で見えないもの

- `:hover` / `:focus-visible` / `:disabled` など、操作しないと現れない状態
- `@media (prefers-reduced-motion: reduce)` 下のスタイル

これらは対象プロパティの母集合に入らないため、**セレクタ単位の突き合わせ** で補う。ビルド済み CSS からセレクタ末尾の擬似クラス・属性セレクタと宣言プロパティ名の組を抽出し、移行前後で集合が一致することを見る。値までは見ないが、「`:disabled` の分岐を書き忘れた」「`[data-selected]` を落とした」類は捕まえられる。

## 12. 移行の順序

決定事項 D4 のとおり 1 つの PR にまとめるが、作業自体は依存関係に沿って進める。

1. 基準スナップショットを取る（`main` の状態で §11 を実行）
2. `variables-{light,dark}-only.css` に `color-scheme` を入れる（style-dictionary）
3. `mixins.module.css` と型生成スクリプトを用意する
4. コンポーネントを 19 個移行する（`.module.css` + `.tsx` + spec / stories）
5. Storybook を切り替える
6. `vite.config.ts` から Vanilla Extract を外し、`.css.ts` と `src/styles/*.ts` を削除する
7. `build-css-variants.ts` を書き換える
8. `package.json` の依存とスクリプトを整理する
9. スナップショットを再取得して差分ゼロを確認する
10. ドキュメントを更新する

4 の途中は Vanilla Extract と CSS Modules が同居するが、コミット単位の話であり PR は 1 本にする。同居中は `:root` に変数が二重に載るものの、`variables.css` は Storybook からしか読まれないため、移行済みコンポーネントの見た目は正しく出る。

## 13. リスクと対策

| リスク | 対策 |
| --- | --- |
| 数値リテラルの単位落ち（`border-width: 1` が無効になる） | §4.4 の一覧を潰す。§11 のスナップショット差分で最終確認 |
| セレクタの書き写し漏れ（`:disabled` の分岐など） | §11.2 のセレクタ集合突き合わせ |
| クラス名のタイポ | §6 の `.d.ts` 生成で型エラーになる |
| `composes` の出力順で宣言が負ける | 共有 mixin は衝突しない宣言のみ。`reducedMotion` は直書き（§5.2） |
| `@keyframes` 名の衝突 | CSS Modules がスコープする。`animation` 値の書き換えも自動 |
| 配色固定版の作り替えで `color-scheme` が抜ける | `verify:dist` が既存の検査で捕まえる（検査は緩めない） |
| Storybook が変数を読めておらず全部既定値で描画される | `test:a11y` の `color-contrast` が大量に落ちるため気づける |
| elevation の影色の表記差 | 同値であることを §2.2 で確認済み。§11 の計算後スタイルでも一致する |

## 14. 決定事項の反映

要件フェーズの D1〜D4 に加えて、本設計で次を決めた。

| # | 決めたこと |
| --- | --- |
| §10 | `src/design-tokens/` と `build:tokens:ts-object` を削除する |
| §11 | 計算後スタイルの突き合わせを行い、**差分ゼロを移行完了の条件** とする |
