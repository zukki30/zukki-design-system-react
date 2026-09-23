# 設計: InputNumber のスピンボタンを 24 × 24px 以上にする

対象 Issue: [#116](https://github.com/zukki30/zukki-design-system-react/issues/116) / 要件: [`requirements.md`](./requirements.md)

## 全体方針

3 つの原則で組み立てる。

1. **DOM 構造は変えず、CSS の軸を縦から横へ倒すだけにする。** ルート・フィールド・スピン列・区切り線という 4 要素の関係は今のままで、`flex-direction` と寸法の持たせ方だけを差し替える
2. **24px は「ボタン自身が持つ幅」として表す。** 今は `flex: 1 1 0` で親の高さを分け合っているため、どこにも 24 という数字が現れない。ボタンに `width` を持たせれば、退行したときに差分として見える
3. **サイズで変わる値は既存どおりルートの 2 ブロックに集める。** `.inputNumber { … }` と `.inputNumber[data-size='sm'] { … }` だけを読めば寸法差が分かる状態を保つ

---

## 要件からの変更点（実装後に差し戻し）

> **この節の決定は取り消した（実装後のレビュー）.** アイコンの描画サイズは要件 R5 どおり **`md` 16px / `sm` 14px** を維持する。以下は一度合意した経緯として残す。差し戻しの理由は [`results.md`](./results.md) を参照。

要件 R5 は当初「アイコンの描画サイズは現状の出し分けを引き継ぐ（`md` 16px / `sm` 14px）」としていたが、**`md` 24px / `sm` 20px に変更する**ことで一度合意した。

理由は 3 つだった。

| 観点 | 内容 |
| --- | --- |
| グリフ自身が余白を持っている | `baselineMinus` は 24 の viewBox の中で x 5〜19 しか使わない。24px で描いても左右 5px ずつ空く。16px まで縮めるのは二重に縮めていることになる |
| 同じグリフの既存の扱いと揃う | `Checkbox` の indeterminate は `baselineMinus` を箱いっぱい、すなわち `md` 24px / `sm` 20px で描いている。同じリポジトリで同じ絵が別の寸法になるのを避ける |
| 線の太さ | `baselineMinus` の線は viewBox 上で 2px。16px で描くと 1.33px、14px では 1.17px になり、非 Retina でにじむ。24px なら 2px、20px でも 1.67px 残る |

実装して並べたところ、24px の `−` / `+` は入力欄の数値に対して主張が強すぎた。スピンボタンはポインタ専用の補助であり、**当たり判定 24px はボタンの `width` が持っているのでアイコンを大きくする必要はない**という整理になり、16 / 14 へ戻した。

---

## 1. レイアウトの設計

### 1-1. 変更前後

```
【変更前】                          【変更後】
┌──────────────┬────┐              ┌──────────────┬────┬────┐
│              │ ▲  │              │              │    │    │
│ 1,234        ├────┤ 42.1px       │ 1,234        │ −  │ +  │ 42.1px
│              │ ▼  │              │              │    │    │
└──────────────┴────┘              └──────────────┴────┴────┘
                22px                              24px 24px
   ボタン 22 × 20.57px  ❌            ボタン 24 × 42.1px  ✅
```

### 1-2. 寸法表

| 値 | `md` | `sm` | 決まり方 |
| --- | --- | --- | --- |
| フィールド高 | 42.1px | 34.1px | `16px × 113.4% + padding × 2`（変更なし） |
| ボタン幅 | 24px | 24px | `--zds-input-number-spin-button-width`（新規） |
| ボタン高 | 42.1px | 34.1px | flex の `stretch` でフィールド高に揃う |
| スピン領域の幅 | 50px | 50px | `左境界 1 + 24 + 区切り 1 + 24` |
| 全体幅（最小） | 132px | 116px | `border 1 + フィールド最小幅 + 50 + border 1` |

`sm` でもボタン幅を縮めないのは、縮めた瞬間に 2.5.8 を割るため。`Checkbox` が当たり判定（`--zds-checkbox-control-size`）を `sm` でも 24px に据え置いているのと同じ考え方で、**サイズ差は「見た目の要素」だけに出し、当たり判定には出さない**。

### 1-3. ボタン高が 24px を割らない保証

ボタン高はフィールド高に追従するため、CSS に 24 という数字が出てこない。下限は `--font-size-base` と `--line-height-line` とパディングの積み上げで決まる。

```
sm のボタン高 = 16px × 113.4% + --spacing-sm × 2 = 34.1px
```

`--font-size-base` は iOS Safari の自動ズーム回避のため 16px から下げない制約がすでにあり、`--spacing-sm` を 0 にしない限り 24px は割らない。とはいえ**トークンの変更で静かに割れる経路**なので、要件 R7 の実測テストで押さえる（後述の 4 章）。

---

## 2. 実装の設計

### 2-1. `InputNumber.tsx`

構造は変えず、**ボタンの順序を入れ替えてアイコンを差し替える**だけ。

```tsx
<div className={styles.inputNumber__spin}>
  <button
    type="button"
    tabIndex={-1}
    aria-label="減らす"
    className={styles.inputNumber__spinButton}
    disabled={disabled}
    onMouseDown={handleMouseDown}
    onClick={() => handleStep('down')}
  >
    {/* 大きさは CSS が持つ（InputNumber.module.css の --zds-input-number-icon-size） */}
    <Icon name="baselineMinus" />
  </button>

  <span className={styles.inputNumber__spinDivider} />

  <button
    type="button"
    tabIndex={-1}
    aria-label="増やす"
    className={styles.inputNumber__spinButton}
    disabled={disabled}
    onMouseDown={handleMouseDown}
    onClick={() => handleStep('up')}
  >
    <Icon name="plus" />
  </button>
</div>
```

- **DOM 順序を見た目に合わせる**（`減らす` → `増やす`）。`tabIndex={-1}` なので Tab 順には影響しないが、支援技術の読み上げ順と視覚順がずれるのを避ける
- `handleStep` / `handleMouseDown` / props の扱いは一切変更しない
- ルート側（`data-*` の付与、`input` の属性）も変更しない

### 2-2. `InputNumber.module.css`

変更は 4 か所。

**(a) ルートの変数**

```css
.inputNumber {
  /*
   * スピンボタン 1 つの幅。WCAG 2.2 の 2.5.8（24 × 24 px 以上）の下限そのものなので、
   * sm でも縮めない（Checkbox の当たり判定と同じ考え方）
   */
  --zds-input-number-spin-button-width: 24px;
  --zds-input-number-field-min-width: 80px;
  --zds-input-number-icon-size: 16px;
  --zds-input-number-padding-block: var(--spacing-md);

  &[data-size='sm'] {
    --zds-input-number-field-min-width: 64px;
    --zds-input-number-icon-size: 14px;
    --zds-input-number-padding-block: var(--spacing-sm);

    border-radius: var(--border-radius-md);
  }
}
```

| 変数 | 変更 |
| --- | --- |
| `--zds-input-number-spin-width: 22px` | → `--zds-input-number-spin-button-width: 24px` に改名。列全体ではなくボタン 1 つの幅を指すようになるため |
| `--zds-input-number-arrow-size: 16px` | → `--zds-input-number-icon-size: 16px` に改名（`sm` 14px）。矢印ではなくなるため名前も合わせる。**値は据え置き** |
| `--zds-input-number-field-min-width` | 変更なし |
| `--zds-input-number-padding-block` | 変更なし |

**(b) スピン列**

```css
.inputNumber__spin {
  display: flex;
  flex-shrink: 0;
  border-inline-start-width: 1px;
  border-inline-start-style: solid;
  border-inline-start-color: var(--color-input-border-default);
}
```

`flex-direction: column` と `width` を落とす。幅は子の合計で決まり、高さは親の `align-items: stretch` で伸びる。

**(c) スピンボタン**

```css
.inputNumber__spinButton {
  flex: 0 0 auto;
  width: var(--zds-input-number-spin-button-width);
  box-sizing: border-box;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  …（padding / border / color / cursor / line-height / transition は現状のまま）

  & > svg {
    width: var(--zds-input-number-icon-size);
    height: var(--zds-input-number-icon-size);
  }
}
```

`flex: 1 1 0`（高さを分け合う）→ `flex: 0 0 auto` + `width`（幅を自分で持ち、高さは stretch で伸びる）。

**(d) 区切り線**

```css
.inputNumber__spinDivider {
  width: 1px;
  flex-shrink: 0;
  background-color: var(--color-input-border-default);
}
```

`height: 1px` → `width: 1px`。横並びの flex 子なので `stretch` で縦いっぱいに伸びる。

**変更しないもの:** `composes` の `inputColorSchemeLight`、`overflow: hidden`、`:focus-within` の outline、hover / disabled / error の配色ブロック、`prefers-reduced-motion` の扱い。

### 2-3. コメントの差し替え

現在 L142-155 にある繰り延べの説明を、次の内容に置き換える。

```css
/*
 * スピンボタンは WCAG 2.2 の 2.5.8（24 × 24 px 以上）を寸法そのもので満たす。
 * 幅は --zds-input-number-spin-button-width が 24px を直接持ち、高さはフィールドに
 * 揃うので md 42.1px / sm 34.1px になる。sm でも幅を縮めないのはこのため。
 *
 * 上下ボタンが隣接するため 2.5.8 の spacing 例外は使えず、擬似要素で当たり判定だけを
 * 広げる手（Tag の閉じるボタン）も隣と重なるので使えない。寸法で満たすしかない。
 *
 * axe-core は target size を検査しないため、InputNumber.stories.tsx の play で
 * 実寸を測っている（jsdom はレイアウトしないので test:a11y 側でしか測れない）
 */
```

### 2-4. `plus` アイコンの追加

触るのは 3 ファイル。一覧は `iconNames` から自動生成されるため、手で書き写す箇所は無い。

**`src/components/Icon/svg/IconPlus.tsx`（新規）**

```tsx
const IconPlus = () => {
  return (
    <path
      d="M19 12.998H12.998V19H10.998V12.998H5V10.998H10.998V5H12.998V10.998H19V12.998Z"
      fillRule="evenodd"
      clipRule="evenodd"
    />
  );
};

export default IconPlus;
```

`baselineMinus`（`M19 12.998H5V10.998H19V12.998Z`）の横棒に、同じ太さの縦棒を足した形。座標をそのまま流用しているので、`−` と `+` を並べたとき**横棒の位置と長さが 1px もずれない**。

| 軸 | 範囲 | 太さ |
| --- | --- | --- |
| 横棒 | x 5 → 19（14px） | y 10.998 → 12.998（2px） |
| 縦棒 | y 5 → 19（14px） | x 10.998 → 12.998（2px） |

**`src/components/Icon/svg/index.ts`** — アルファベット順の位置（`outlineCheck` の後、`windowRestore` の前）へ 1 行追加。

**`src/components/Icon/types.ts`** — `iconNames` の同じ位置へ `'plus',` を追加。

`IconName` は `iconNames` からの導出、`dist/AGENTS.md` のアイコン一覧は `scripts/build-agent-guide.ts` による自動生成なので、ここまでで配布物まで伝わる。

---

## 3. 既存テストへの影響

`InputNumber.spec.tsx` は **1 行も変更しない**。根拠は次のとおり。

| テスト | 影響 | 理由 |
| --- | --- | --- |
| `getByLabelText('増やす')` / `('減らす')` | なし | `aria-label` を変えないため。DOM 順序の入れ替えは `getByLabelText` に影響しない |
| `field.closest('div')` で `data-error` を見る | なし | `input` の親はルートのままで、構造を変えていない |
| `screen.getByRole('spinbutton').parentElement` で `data-size` を見る | なし | 同上 |
| 増減・`onChange`・`disabled`・`ref` | なし | `handleStep` を変えていない |

**これが変更前後で通ることが、R4「既存の振る舞いを変えない」の担保になる。**

---

## 4. target size の自動検証（要件 R7）

### 4-1. 置き場所の選定

| 案 | 判断 |
| --- | --- |
| `*.spec.tsx`（jsdom） | ❌ jsdom はレイアウトしないため `getBoundingClientRect()` が全て 0 を返す。検査にならない |
| ブラウザ用の vitest プロジェクトを新設 | ❌ `vitest.config.ts` に 4 つ目のプロジェクトが増え、CI 時間も増える。得るものに対して重い |
| **ストーリーの `play`** | ✅ 既存の `a11y-light` / `a11y-dark` がそのまま実行する。設定変更ゼロ |

`@storybook/addon-vitest` はストーリーをブラウザで描画したうえで `play` を実行するため、**`pnpm test:a11y` を走らせるだけで実寸の検査が入る**。新しいプロジェクトもコマンドも増えない。

このリポジトリに `play` を持つストーリーはまだ無いため、**これが最初の 1 件になる**。`storybook/test` 自体は `Button` / `IconButton` / `Steps` / `Tag` のストーリーが `fn` を import しており、依存としては既に入っている。

### 4-2. 実装

`InputNumber.stories.tsx` に共通のアサーションを 1 つ置き、`md` と `sm` のストーリーから呼ぶ。

```tsx
import { expect, within } from 'storybook/test';

/** WCAG 2.2 SC 2.5.8 Target Size (Minimum) の下限 */
const MIN_TARGET_SIZE = 24;

/**
 * スピンボタンの実寸が 2.5.8 を満たすことを確かめる。
 *
 * axe-core は target size を検査しないため、ここで測る。
 * jsdom はレイアウトしないので、ブラウザで動く test:a11y 側でしか確認できない
 */
const expectSpinButtonTargetSize = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);

  for (const label of ['減らす', '増やす']) {
    const { width, height } = canvas.getByLabelText(label).getBoundingClientRect();

    await expect(width).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
    await expect(height).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
  }
};

export const Default: Story = {
  render: (args) => <InputNumber {...args} />,
  play: ({ canvasElement }) => expectSpinButtonTargetSize(canvasElement),
};

export const SizeSm: Story = {
  args: { size: 'sm', defaultValue: 186 },
  render: (args) => <InputNumber {...args} />,
  play: ({ canvasElement }) => expectSpinButtonTargetSize(canvasElement),
};
```

- 既存の `Default`（`md`）と `SizeSm`（`sm`）に足すだけで、**新しいストーリーを増やさない**。autodocs の見た目も変わらない
- 両サイズを測るので、`sm` だけの退行も拾える
- ライト / ダークの 2 プロジェクトで各 1 回ずつ走る。配色に依存しない検査なので重複は無害
- `Disabled` には付けない。無効なコントロールは 2.5.8 の対象外

> autodocs のページでは `play` は自動実行されない（`parameters.docs.story.autoplay` の既定が `false`）。ドキュメントの表示には影響しない。

---

## 5. 変更するファイル

| ファイル | 変更 |
| --- | --- |
| `src/components/Icon/svg/IconPlus.tsx` | **新規**。`plus` のパス |
| `src/components/Icon/svg/index.ts` | `plus` の再 export を 1 行追加 |
| `src/components/Icon/types.ts` | `iconNames` に `'plus'` を追加 |
| `src/components/InputNumber/InputNumber.tsx` | ボタンの順序入れ替え、アイコン差し替え、コメント修正 |
| `src/components/InputNumber/InputNumber.module.css` | 変数の改名と値、`__spin` / `__spinButton` / `__spinDivider` の寸法、コメント差し替え |
| `src/components/InputNumber/InputNumber.stories.tsx` | `play` による実寸検査を追加 |
| `docs/specs/form-component-size/results.md` | 積み残しが解消したことを追記 |

**変更しないファイル**

| ファイル | 理由 |
| --- | --- |
| `InputNumber.spec.tsx` | 3 章のとおり、既存のまま通ることが担保になる |
| `InputNumber.module.css.d.ts` | クラス名を増減しないため内容は変わらない（`pnpm build:css-types` で差分が出ないことは確認する） |
| `src/main.tsx` / `README.md` / `docs/agent-guide.template.md` | コンポーネント一覧に変化がないため。`IconName` / `iconNames` は `Icon` からの再 export なので、`plus` の追加は `src/main.tsx` を触らずに公開 API まで伝わる（`README.md` のアイコン一覧は手書きしておらず、`dist/AGENTS.md` は自動生成） |
| `Icon.spec.tsx` / `Icon.stories.tsx` | 全アイコンを列挙していないため、追加による変更は不要 |

---

## 6. 確認すること

| 観点 | 方法 |
| --- | --- |
| 24 × 24px 以上（`sm` / `md`） | `pnpm test:a11y`（4-2 の `play`） |
| 振る舞いの維持 | `pnpm test` が**無変更で**通る |
| a11y の退行なし | `pnpm test:a11y` のライト / ダーク両方 |
| 配布物 | `pnpm verify:dist`（`plus` が `dist/AGENTS.md` に載ることを含む） |
| 型・Lint・整形 | `pnpm typecheck` / `pnpm lint:check` / `pnpm format:check` |
| CSS の型 | `pnpm check:css-types` で差分が出ないこと |
| 見た目 | Storybook をライト / ダークで開き、`md` / `sm` / `disabled` / `error` を目視。`−` と `+` の横棒が同じ高さに並ぶこと、角丸からはみ出さないこと |

---

## 7. 積み残し（この設計では扱わない）

| 項目 | 扱い |
| --- | --- |
| 長押しによる連続増減 | 要件どおり範囲外 |
| RTL での `−` / `+` の並び | `flex-direction: row` は書字方向に従うため RTL では左右が入れ替わる。数値入力の慣習として妥当な挙動なので、特別な対応はしない |
| 他コンポーネントの target size | すでに 24px を満たしている |
