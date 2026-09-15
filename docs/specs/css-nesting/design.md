# 設計: CSS を入れ子（CSS Nesting）で書く

対象 Issue: [#117](https://github.com/zukki30/zukki-design-system-react/issues/117) / 要件: [requirements.md](./requirements.md)

## 1. 入れ子の規則（確定版）

要件 R2 を、迷いの出ない形まで具体化する。次の 6 つですべてのファイルを機械的に書き換えられる。

### 規則 1: トップレベルのルールはクラス 1 つにつき 1 つ

`.button { … }` のような**クラス単体のルール**をトップレベルに置き、そのクラスで始まるルールをすべてその中へ入れる。

全 20 ファイルを調べたところ、**先頭に現れるクラスはすべてクラス単体のルールを持っている**（`.x[data-y]` しか無いクラスは 1 つも無い）ため、この形が必ず作れる。結果、トップレベルのルールは 314 個から **85 個**になる。

ブロック（`.button`）とパーツ（`.button__label`）はどちらもトップレベルに並べる。パーツをブロックの中へ子孫セレクタとして畳むことはしない（要件 C）。

### 規則 2: 行き先は「セレクタの先頭に現れるクラス」で決める

| 元のセレクタ | 行き先 | 書き方 |
| --- | --- | --- |
| `.button[data-variant='primary']:hover` | `.button` | `&[data-variant='primary'] { &:hover { … } }` |
| `.button[data-size='sm'] .button__label` | `.button` | `&[data-size='sm'] { & .button__label { … } }` |
| `.tag[data-variant='red'] .tag__closeButton:hover` | `.tag` | `&[data-variant='red'] { & .tag__closeButton { &:hover { … } } }` |
| `.checkbox__input:checked + .checkbox__box` | `.checkbox__input` | `&:checked + .checkbox__box { … }` |
| `.select__field option` | `.select__field` | `& option { … }` |
| `.tag__closeButton > svg` | `.tag__closeButton` | `& > svg { … }` |
| `a.breadcrumb__link:hover` | `.breadcrumb__link` | `a&:hover { … }` |

### 規則 3: ネストしたセレクタは `&` から書き始める

裸の要素セレクタ（`option` / `svg`）も `& option` / `& > svg` と書く。唯一の例外は型セレクタが前に付く `a&:hover` で、これは `&` を先頭にできない。

`&` を省いても生成される CSS は同じだが、`.tag__closeButton` のようなクラスが**トップレベルのルールに見えてしまう**のを避ける。

### 規則 4: 深さはトップレベルから 3 段まで

最も深くなるのは `Tag` の 3 段（`.tag` → `&[data-variant='red']` → `& .tag__closeButton` → `&:hover`）。これを超えるものは現状のセレクタからは生じない。

### 規則 5: 宣言はネストしたルールより前にまとめる

1 つのルールの中身は必ずこの順で書く。

```css
.checkbox {
  /* 1. composes（トップレベルのルール直下にしか書けない） */
  composes: interactiveTouch from '../../styles/mixins.module.css';

  /* 2. --zds-* のカスタムプロパティ */
  --zds-checkbox-box-size: 24px;

  /* 3. 通常の宣言 */
  display: inline-flex;

  /* 4. prefers-reduced-motion（既存どおりルールの中に直接書く） */
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }

  /* 5. ネストしたルール */
  &[data-size='sm'] {
    --zds-checkbox-box-size: 20px;
  }
}
```

**ネストしたルールの後ろに宣言を置かない。** ネストの後に続く宣言（CSSNestedDeclarations）はブラウザ対応が新しく、`build.cssTarget` の下限として並べている Chrome 123 はそれ以前にあたる。宣言を先に固めておけば、この差異に一切依存しない。

`composes` はネストの中に書くとビルドが落ちる（要件で検証済み）ため、必ずトップレベルのルール直下の先頭に置く。

### 規則 6: ネストしたルール同士の順序は元のまま

グループ内の相対順は変えない。これは詳細度が等しいルール同士の勝敗を守るための約束である（§3）。

## 2. 書き換えの実例

### 2.1 `Button` — 47 ルール → 4 ルール

変種ごとに 4 ルールへ散っていたものが 1 ブロックに集まる。

```css
/* 変更前 */
.button[data-variant='primary'] { … }
.button[data-variant='primary']:hover { … }
.button[data-variant='primary'][data-selected='true'] { … }
.button[data-variant='primary']:disabled { … }
/* これが 8 変種ぶん続く */

/* 変更後 */
.button {
  …

  &[data-variant='primary'] {
    background-color: var(--color-primary-default);
    border-color: var(--color-primary-default);
    color: var(--color-text-on-accent-default);

    &:hover { … }
    &[data-selected='true'] { … }
    &:disabled { … }
  }
}
```

サイズも同じ形になり、`.button[data-size='sm'] .button__label` はサイズのブロックへ収まる。**「`sm` のときに何が変わるか」が 1 箇所で読める**ようになる。

```css
&[data-size='sm'] {
  padding-inline: var(--spacing-2xl);
  border-radius: var(--border-radius-sm);

  &[data-has-start-icon='true'] { padding-inline-start: var(--spacing-xl); }
  &[data-has-end-icon='true'] { padding-inline-end: var(--spacing-xl); }

  & .button__label {
    padding-block-start: var(--spacing-lg);
    padding-block-end: var(--spacing-md);
    font-size: var(--font-size-xs);
  }
}
```

### 2.2 `Tag` — 変種と閉じるボタンが 1 ブロックに入る

```css
/* 変更前: 8 変種 × 3 ルール = 24 ルール */
.tag[data-variant='red'] { … }
.tag[data-variant='red'] .tag__closeButton { color: var(--color-red-600); }
.tag[data-variant='red'] .tag__closeButton:hover { color: var(--color-red-700); }

/* 変更後 */
.tag {
  …

  &[data-variant='red'] {
    border-color: var(--color-red-200);
    background-color: var(--color-red-50);
    color: var(--color-red-600);

    & .tag__closeButton {
      color: var(--color-red-600);

      &:hover { color: var(--color-red-700); }
    }
  }
}
```

### 2.3 `Checkbox` — 入力の状態が隣の箱を変える 10 ルール

`.checkbox__input` で始まるルールが 10 個ある。規則 2 により、これらはすべて `.checkbox__input` の中へ入る。

```css
.checkbox__input {
  position: absolute;
  …

  &:hover:not(:disabled):not(:checked):not(:indeterminate) + .checkbox__box { … }

  &:checked + .checkbox__box,
  &:indeterminate + .checkbox__box { … }

  &:checked + .checkbox__box .checkbox__checkIcon { opacity: 1; }
  /* checked かつ indeterminate のときは indeterminate を優先しチェックを隠す */
  &:indeterminate + .checkbox__box .checkbox__checkIcon { opacity: 0; }
}
```

**箱の見た目が `.checkbox__box` と `.checkbox__input` の 2 箇所に分かれる**のは規則 2 の帰結である。「素の見た目は `.checkbox__box`、入力の状態で変わるぶんは `.checkbox__input`」という分かれ方になり、後者は 1 箇所にまとまる。最後の 2 ルールのように**順序に意味がある組**が同じグループに入るため、規則 6 だけで勝敗が保たれる点も都合がよい。

### 2.4 `Tooltip` — 8 方向 × 2 ルール

`.tooltip__popup[data-placement='top']` と `.tooltip__popup[data-placement='top'] .tooltip__arrow` が離れて置かれている。入れ子にすると方向ごとに「本体の位置」と「矢印の位置」が隣り合う。

### 2.5 `Breadcrumb` — 型セレクタが付く 1 件

```css
.breadcrumb__link {
  …

  /* リンクのときだけ（現在ページの span には当てない） */
  a&:hover { … }
}
```

## 3. 出力順の変化

入れ子にするとルールがファイル内を移動するため、フラットに展開したときの順序が変わる。**全 20 ファイルで 325 組**の前後が入れ替わる（`Tag` が 120 組で最多）。

順序が変わっても、次のいずれかなら描画結果は変わらない。

1. 詳細度が異なる（勝敗は詳細度で決まる）
2. 当たる要素が異なる（そもそも競合しない）
3. 触るプロパティが重ならない

書き換え前に全ペアを機械で調べた（`.tmp/analyze-order.mjs` で試算）。

| 判定 | 件数 |
| --- | --- |
| 入れ替わるペア | 325 |
| うち詳細度が等しい | 一部 |
| うち**同じ要素に当たり、同じプロパティを触る**もの | **0** |

つまり**順序が問題になる箇所は存在しない**。ただしこれは書き換え前の見積もりなので、書き換え後の実物に対して §4 の検査を必ず通す。

例（`StepsItem`。詳細度はどちらも (0,3,0) で順序が逆転するが、触るプロパティが重ならない）:

| ルール | プロパティ |
| --- | --- |
| `.stepsItem__control[data-status='current'] .stepsItem__label` | `font-weight` |
| `.stepsItem[data-orientation='vertical'] .stepsItem__label` | `white-space` / `overflow-wrap` |

## 4. 検証の設計

### 4.1 `compare-flat-css.ts`（第 1 段・必須）

`docs/specs/css-nesting/compare-flat-css.ts` に置く。`migrate-to-css-modules` の検証スクリプトと同じ「一度きりの道具として spec に残す」扱いとする（`docs/` 配下なので lint / typecheck の対象外。`pnpm exec tsx` で実行する）。

**原理。** 古い `cssTarget` を指定してビルドすると、esbuild が入れ子を `:is()` を挟まずフラットなセレクタへ展開する（要件フェーズで検証済み）。入れ子化が純粋な書き換えなら、展開結果は変更前の CSS と一致する。

```
src/**/*.module.css
  → vite build（configFile: false / cssTarget: ['chrome100'] / minify: true / write: false）
  → 出力 CSS（フラット・ハッシュ付きクラス名）
  → css.modules.getJSON の対応表でハッシュを元のクラス名へ戻す
  → ルール単位（セレクタ + 宣言ブロック）に分解して JSON で書き出す
```

`--out` で書き出し、変更前後の 2 ファイルを `--compare` で突き合わせる。

**判定。**

| 差分 | 判定 |
| --- | --- |
| ルールの増減・宣言の変化 | **不可**（要件 R1 違反） |
| ルールの順序だけの入れ替わり | 条件付きで可。詳細度・当たる要素・プロパティの 3 点で衝突しないことを確かめ、衝突ゼロなら通す |

順序の判定ロジックは §3 と同じものをスクリプトに実装する（詳細度の算出は `:not()` / `:is()` の中身の最大を採る。当たる要素は一番右の複合セレクタが持つクラスで見る）。

**ハッシュの戻し方。** `getJSON` はファイルごとに `{ 元のクラス名: 生成名 }` を返す。`composes` を持つクラスは生成名が空白区切りで複数になるため、分解して 1 対 1 の対応表を作る。`.tag__label` のように自分自身の生成名が先頭に来るため、全トークンを登録すれば mixin 側のクラス名も戻せる。

### 4.2 計算後スタイルのスナップショット（第 2 段）

既存の `docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts` と `diff-computed-styles.ts` をそのまま使う。

```bash
# 変更前（origin/main）
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts --out .tmp/nest-before.json

# 変更後
pnpm build-storybook
pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts --out .tmp/nest-after.json
pnpm exec tsx docs/specs/migrate-to-css-modules/diff-computed-styles.ts .tmp/nest-before.json .tmp/nest-after.json
```

全ストーリー × ライト / ダークの計算後スタイルを比べる。hover / focus / checked などストーリーが既定で描画しない状態は見られないため、そこは 4.1 が受け持つ。

### 4.3 既存の検査（第 3 段）

`pnpm lint:check` / `format:check` / `typecheck` / `test` / `test:a11y` / `check:css-types` / `verify:dist`。

`check:css-types` は**差分が出ないことが期待値**である。差分が出たらクラスを増減させてしまっている。

## 5. `AGENTS.md` の改訂

「スタイリング（CSS Modules）」の節に次を追加・修正する。

**追加する項目（規則 1〜6 を要約）**

- ルールは入れ子で書く。トップレベルのルールはクラス 1 つにつき 1 つにし、そのクラスで始まるルールをその中へ入れる
- 行き先は「セレクタの先頭に現れるクラス」で決める。判断を挟まない
- ネストしたセレクタは `&` から書き始める（例外は `a&:hover`）
- 深さは 3 段まで
- 宣言はネストしたルールより前にまとめる。**ネストの後ろに宣言を置かない**（対応が新しく、`cssTarget` の下限より後に入った機能のため）
- `composes` はトップレベルのルール直下の先頭にだけ書ける（ネストの中に書くとビルドが落ちる）
- **パーツをブロックのルールへ子孫セレクタとして畳まない。** 詳細度が上がるうえ、`Card` のように入れ子にできるコンポーネントでは内側のパーツにも当たる。既存の「継承するカスタムプロパティで配る」方針は変わらない
- セレクタリスト（`.a, .b`）のルールの中にはネストしない。`&` は `:is()` と同じで、詳細度がリスト中の最大になるため

**書き換える既存の記述**

`data-*` 属性の例が `.button[data-size='sm'] .button__label { … }` とフラットなので、入れ子の形に差し替える。`Card` のカスタムプロパティの例も同様に入れ子で示す。

`CLAUDE.md` はポインタなので触らない。`dist/AGENTS.md`（`docs/agent-guide.template.md` の生成物）は利用側向けで CSS の書き方を含まないため触らない。

## 6. リスクと対策

| リスク | 対策 |
| --- | --- |
| 手作業の書き換えで宣言を落とす / 重複させる | 4.1 でルール単位の突き合わせを行う。目視に頼らない |
| 詳細度を変えてしまう（`&` の入れ子を間違える） | 同上。展開後のセレクタ文字列が一致することで担保する |
| 順序の逆転で勝敗が変わる | §3 の事前分析で 0 件。4.1 で書き換え後も再判定する |
| `composes` をネストの中に入れてしまう | ビルドが落ちるため気づける（静かに壊れない） |
| クラスを増減させてしまう | `pnpm check:css-types` の差分で気づける |
| 利用側のブラウザで入れ子が解釈できない | `cssTarget` の下限（Chrome 123 / Safari 17.5 / Firefox 120）はいずれも入れ子対応済み。README の対応ブラウザも満たすため要件は変わらない |

## 7. 作業単位

1 コミット = 1 コンポーネントを基本とし、規模の小さいものはまとめる。検証スクリプトと `AGENTS.md` は別コミットにする。詳細は実装計画フェーズで詰める。
