# 実装計画: InputNumber のスピンボタンを 24 × 24px 以上にする

対象 Issue: [#116](https://github.com/zukki30/zukki-design-system-react/issues/116)
要件: [`requirements.md`](./requirements.md) / 設計: [`design.md`](./design.md)

## 進め方

ブランチは `fix/input-number-spin-target-size` を `main`（`0209f3a`）から作成する。

4 ステップに分け、**各ステップの終わりに `pnpm lint:check` / `pnpm format:check` / `pnpm typecheck` / `pnpm test` を通してからコミット**する。どのステップで止まっても CI が緑のままになる粒度にしている。

`pnpm test:a11y` と `pnpm verify:dist` は実行に時間がかかるため、ステップ 4 でまとめて回す。ただし**ステップ 3 だけは `pnpm test:a11y` の実行がそのステップの目的そのもの**なので、そこでも回す。

### ステップの並べ方について

アイコン追加（ステップ 1）を先に独立させる。`plus` は `InputNumber` からしか使わないが、

- `iconNames` を触ると `dist/AGENTS.md` の生成と `verify-dist` の網羅性検査に波及する。レイアウト変更と混ざると、失敗したときにどちらが原因か切り分けづらい
- アイコン追加だけなら既存の描画に一切影響しない。単独でコミットできる

という理由による。

---

## ステップ 1: `plus` アイコンを追加する

| ファイル | 変更 |
| --- | --- |
| `src/components/Icon/svg/IconPlus.tsx` | **新規** |
| `src/components/Icon/svg/index.ts` | 再 export を 1 行追加（`outlineCheck` の後、`windowRestore` の前） |
| `src/components/Icon/types.ts` | `iconNames` に `'plus',` を追加（同じ位置） |

**`IconPlus.tsx`**

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

`baselineMinus`（`M19 12.998H5V10.998H19V12.998Z`）の座標をそのまま流用し、同じ太さの縦棒を足した形。

**テスト:** 追加しない。`Icon.spec.tsx` は全アイコンを列挙しておらず、`Icon.stories.tsx` も `argTypes.name` の select から引くだけなので、`iconNames` への追加で自動的に選べるようになる。

**確認:**

```bash
pnpm typecheck && pnpm lint:check && pnpm format:check && pnpm test
```

`plus` が `dist/AGENTS.md` へ載ることは `scripts/build-agent-guide.ts` が `iconNames` から生成するため自動。検査はステップ 4 の `pnpm verify:dist` で行う。

**コミット:** `feat: add plus icon`

---

## ステップ 2: スピンボタンを横並びにする

### 2-1. `src/components/InputNumber/InputNumber.module.css`

変更は 5 か所。

**(a) ルートの変数（`.inputNumber` の冒頭）**

```css
  /*
   * 独自スピンボタン 1 つの幅と、フィールドが縮みきらないための下限。
   * 幅は WCAG 2.2 の 2.5.8（24 × 24 px 以上）の下限そのものなので sm でも縮めない
   * （理由は .inputNumber__spinButton のコメント）
   */
  --zds-input-number-spin-button-width: 24px;
  --zds-input-number-field-min-width: 80px;
  --zds-input-number-icon-size: 24px;
  --zds-input-number-padding-block: var(--spacing-md);
```

| 変更前 | 変更後 |
| --- | --- |
| `--zds-input-number-spin-width: 22px` | `--zds-input-number-spin-button-width: 24px` |
| `--zds-input-number-arrow-size: 16px` | `--zds-input-number-icon-size: 24px` |

**(b) `[data-size='sm']` ブロック**

```css
  &[data-size='sm'] {
    --zds-input-number-field-min-width: 64px;
    --zds-input-number-icon-size: 20px;
    --zds-input-number-padding-block: var(--spacing-sm);

    border-radius: var(--border-radius-md);
  }
```

`--zds-input-number-arrow-size: 14px` → `--zds-input-number-icon-size: 20px`。スピンボタンの幅は `sm` でも上書きしない。

**(c) `.inputNumber__spin`**

```css
/* エラー・無効時の色は .inputNumber[data-…] 側で当てている */
.inputNumber__spin {
  display: flex;
  flex-shrink: 0;
  border-inline-start-width: 1px;
  border-inline-start-style: solid;
  border-inline-start-color: var(--color-input-border-default);
}
```

`flex-direction: column` と `width` の 2 行を削除する。幅は子の合計（24 + 1 + 24）で決まり、高さは親の `align-items: stretch` で伸びる。

**(d) `.inputNumber__spinButton` — コメントと 2 行**

コメント（現在の L142-155）を次に差し替える。

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
.inputNumber__spinButton {
  flex: 0 0 auto;
  width: var(--zds-input-number-spin-button-width);
  …
```

`flex: 1 1 0` → `flex: 0 0 auto` に変え、`width` を足す。`& > svg` の参照先を `--zds-input-number-icon-size` に差し替える（コメントの「Icon は width/height 属性で 24 を出すが、CSS の指定が優先される」はそのまま残す）。

**(e) `.inputNumber__spinDivider`**

```css
.inputNumber__spinDivider {
  width: 1px;
  flex-shrink: 0;
  background-color: var(--color-input-border-default);
}
```

`height: 1px` → `width: 1px`。

**変更しない:** `composes` の `inputColorSchemeLight`、`overflow: hidden`、`:focus-within`、hover / disabled / error の配色ブロック、`prefers-reduced-motion` の扱い。

### 2-2. `src/components/InputNumber/InputNumber.tsx`

`.inputNumber__spin` の中身を、**`減らす` → 区切り線 → `増やす`** の順に入れ替える。

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

`handleStep` / `handleMouseDown` / props の扱い / ルートの `data-*` / `input` の属性は**一切変更しない**。

### 2-3. 確認

```bash
pnpm build:css-types   # 差分が出ないこと（クラス名を増減していないため）
pnpm typecheck && pnpm lint:check && pnpm format:check && pnpm test
```

**`pnpm test` を無変更で通すことがこのステップの受け入れ条件。** `InputNumber.spec.tsx` は 1 行も編集しない。DOM 順序を入れ替えても `getByLabelText` / `closest` / `parentElement` のいずれにも影響しないことの裏取りになる（設計 3 章）。

`git status` に `InputNumber.module.css.d.ts` が出たら、クラス名を意図せず変えている。その場で原因を確認する。

**コミット:** `fix: lay out InputNumber spin buttons horizontally to meet WCAG 2.5.8`

---

## ステップ 3: 実寸の自動検証を追加する

### 3-1. `src/components/InputNumber/InputNumber.stories.tsx`

ファイル冒頭に import と共通のアサーションを置き、`Default`（`md`）と `SizeSm`（`sm`）から呼ぶ。

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
```

```tsx
export const Default: Story = {
  render: (args) => <InputNumber {...args} />,
  play: ({ canvasElement }) => expectSpinButtonTargetSize(canvasElement),
};

export const SizeSm: Story = {
  args: {
    size: 'sm',
    defaultValue: 186,
  },
  render: (args) => <InputNumber {...args} />,
  play: ({ canvasElement }) => expectSpinButtonTargetSize(canvasElement),
};
```

- 新しいストーリーは増やさない。autodocs の見た目は変わらない
- `Disabled` には付けない（無効なコントロールは 2.5.8 の対象外）
- `meta.render` は触らない

### 3-2. 実装中に確かめること

このリポジトリで `play` を持つ最初のストーリーになるため、想定どおり動くかを実際に見る。

| 確認 | 期待 |
| --- | --- |
| `a11y-light` / `a11y-dark` で `play` が実行されるか | `pnpm test:a11y` のテスト件数が 4 件（2 ストーリー × 2 配色）増える |
| **わざと壊したとき落ちるか** | `--zds-input-number-spin-button-width` を一時的に `20px` にして `pnpm test:a11y` が**失敗する**ことを確認し、元に戻す |
| `storybook/test` の import 経路 | `within` / `expect` が取れること。取れない場合は `play` コンテキストの `canvas` を使う形に切り替える |

2 つ目は省略しない。**通ることより、壊れたときに落ちることのほうが重要**で、それを確かめないと「検査を足した」と言えない。

### 3-3. 確認

```bash
pnpm typecheck && pnpm lint:check && pnpm format:check && pnpm test
pnpm test:a11y
```

**コミット:** `test: assert InputNumber spin button target size in the browser`

---

## ステップ 4: 記録の更新と全体の検証

### 4-1. `docs/specs/form-component-size/results.md`

L99-107 の「`InputNumber` のスピンボタンだけは満たせない」節と L142 の積み残しに、**解消したことを追記する**（過去の記録なので本文は書き換えない）。

```markdown
> **解消済み（2026-09-24）.** #116 でスピンボタンを横並びにし、`sm` / `md` とも 24 × 24px 以上を満たした。
> 経緯は [`docs/specs/input-number-spin-target-size/`](../input-number-spin-target-size/) を参照。
```

### 4-2. `docs/specs/input-number-spin-target-size/results.md`

他の spec と同じく結果ファイルを書く。実測値、`play` を最初に導入した判断、想定と違った点を残す。

### 4-3. 変更しないことの確認

| ファイル | 確認 |
| --- | --- |
| `src/components/InputNumber/InputNumber.spec.tsx` | `git diff` に出ないこと |
| `src/components/InputNumber/InputNumber.module.css.d.ts` | 同上 |
| `src/main.tsx` / `README.md` / `docs/agent-guide.template.md` | 同上（公開 API とコンポーネント一覧に変化がないため） |

### 4-4. 全体の検証

```bash
pnpm lint:check
pnpm format:check
pnpm typecheck
pnpm check:css-types
pnpm test
pnpm test:a11y
pnpm verify:dist
```

`verify:dist` は `plus` が `dist/AGENTS.md` のアイコン一覧に載ることを含めて検査する。

### 4-5. 目視

`pnpm dev` で Storybook を開き、ツールバーの theme を **light / dark 両方**に切り替えて確認する。

| 見る場所 | 期待 |
| --- | --- |
| `Default` / `SizeSm` | `−` と `+` が右端に横並び。**2 つの横棒が同じ高さに揃う** |
| `Disabled` / `Error` | 区切り線と左境界の色が状態に追従する（縦線になっても配色ブロックは効いている） |
| 角丸 | hover 時の背景が右上・右下の角からはみ出さない |
| `DefaultValue`（`1000000000`） | 桁が多くてもボタンが潰れない |
| フォーカス | 入力欄をクリック → `:focus-within` の outline が全体に出る。スピンボタンを押してもフォーカスが移らない |

**コミット:** `docs: record InputNumber target size fix`

---

## PR

- タイトル: `fix: meet WCAG 2.5.8 target size for InputNumber spin buttons`
- 本文に `Closes #116` を入れる
- **見た目が変わるので Storybook のスクリーンショットを添える**（`md` / `sm` を light / dark で）
- 利用側から見た変更点として次を書く
  - スピンボタンが縦並び（`▲` / `▼`）から横並び（`−` / `+`）になった
  - `InputNumber` の全体幅が 27px 広がった（`md` で最小 105px → 132px）
  - `plus` アイコンが `iconNames` に増えた
  - 公開 API（`InputNumberProps` / `InputNumberSize`）に変更はない

破壊的な API 変更とトークンの再生成はどちらも無い。

---

## 想定される詰まりどころ

| 箇所 | 起きうること | 対処 |
| --- | --- | --- |
| `play` の実行 | `storybook/test` から `within` / `expect` が取れない | `play: ({ canvas }) => …` を使う形へ切り替える（Storybook 10 は `play` コンテキストに `canvas` を渡す） |
| `getBoundingClientRect` | 幅がちょうど 24 のため、端数で `23.999…` になる可能性 | headless Chromium は dpr 1 なので通常は起きない。出たら `toBeGreaterThanOrEqual(MIN_TARGET_SIZE - 0.5)` ではなく、**原因（ズームや transform）を先に特定する** |
| 区切り線の伸び | 縦線が高さいっぱいに伸びない | `.inputNumber__spin` に `align-items` を書いていないこと（既定の `stretch` が効くこと）を確認する |
| `check:css-types` | 差分が出る | クラス名を意図せず変えている。`__spin` / `__spinButton` / `__spinDivider` の名前を維持する |
