# 要件: CSS を入れ子（CSS Nesting）で書く

対象 Issue: [#117 CSS の書き方を入れ子を利用するようにする](https://github.com/zukki30/zukki-design-system-react/issues/117)

## Issue の指示

> https://developer.mozilla.org/ja/docs/Web/CSS/Guides/Nesting/Using
> を利用して CSS を記載する

## 事前に検証した事実

要件を書く前に、実際のビルド経路（Vite 8 + postcss + esbuild）に入れ子の CSS を通して確かめた。以降の記述はこの結果を前提にしている。

| 検証 | 結果 |
| --- | --- |
| CSS Modules のスコープがネスト内のクラスにも効くか | **効く。** `&[data-size='sm'] { .block__label { … } }` の内側も `_block__label_xxx_12` に置換される |
| `composes` をネストしたルールに書けるか | **書けない。** `getSingleLocalNamesForComposes` でビルドが落ちる。静かに壊れることはない |
| 出力 CSS に入れ子が残るか | **残る。** `build.cssTarget`（`chrome123` / `safari17.5` / `firefox120`）がいずれも入れ子対応済みのため、esbuild は展開しない |
| 古いターゲットで展開させたときの形 | `:is()` を挟まず**元と同じフラットなセレクタ**に戻る。`a&:hover` → `a.link:hover` も同様 |

最後の 1 つは検証の道具として使う（R8）。

### 対応ブラウザとの関係

出力 CSS に入れ子が残るため、**利用側のブラウザにも入れ子対応が要る**。ネイティブ対応は Chrome 112+ / Safari 17.2+ / Firefox 117+ で、いずれも `build.cssTarget` の下限（`chrome123` / `safari17.5` / `firefox120`）より古い。README が掲げる「各最新版」も満たす。**対応ブラウザの要件は変わらない。**

## 現状

`origin/main`（`098bb70`）のソースを読んで確認した事実である。

### A. ルールはすべてフラットに並んでいる

`src/**/*.module.css` は 20 ファイル・2,497 行。`@media (prefers-reduced-motion: reduce)` を各ルールの中に書いている箇所（入れ子の at-rule）以外に入れ子は 1 つも無い。

トップレベルのルールは **314 個**あり、そのセレクタの先頭に現れるクラスは **85 種**しかない。同じクラスで始まるルールが平均 3.7 個に分かれている計算になる。

| ファイル | 現在のルール数 | 先頭クラスの種類 |
| --- | --- | --- |
| `Button.module.css` | 47 | 4 |
| `Tag.module.css` | 30 | 3 |
| `IconButton.module.css` | 24 | 3 |
| `StepsItem.module.css` | 24 | 5 |
| `InputNumber.module.css` | 22 | 5 |
| `Checkbox.module.css` | 20 | 8 |
| `Tooltip.module.css` | 19 | 3 |
| （以下略。全 20 ファイルで 314 → 85） | | |

`Button` は `.button` 1 つに対して 40 ルールが並んでおり、「`primary` のときの見た目」を読むにはファイル内を 4 箇所拾い歩く必要がある。ここが入れ子で最も改善する。

### B. 現れるセレクタの形は 7 種類

| # | 形 | 例 | 件数の目安 |
| --- | --- | --- | --- |
| 1 | ブロック + 状態・バリアント | `.button[data-variant='primary']:hover` | 最多 |
| 2 | ブロックの状態 + パーツ | `.tag[data-variant='red'] .tag__closeButton:hover` | 多 |
| 3 | パーツ + 状態・擬似要素 | `.input__field::placeholder` / `.tag__closeButton > svg` | 多 |
| 4 | 兄弟結合子をまたぐもの | `.checkbox__input:checked + .checkbox__box .checkbox__checkIcon` | `Checkbox` / `Radio` / `Switch` |
| 5 | 型セレクタ付き | `a.breadcrumb__link:hover` | 1 件 |
| 6 | セレクタリスト | `.button[data-selected='true'], .button:disabled, .button[data-loading='true']` | 数件 |
| 7 | 要素セレクタ | `.select__field option` | 数件 |

### C. 入れ子で**やってはいけない**ことが 2 つある

どちらも `AGENTS.md` にすでに理由が書かれている。

- **パーツをブロックのルールへ子孫セレクタとして取り込まない。** `.card__body` を `.card { & .card__body { … } }` に畳むと詳細度が (0,1,0) から (0,2,0) に上がるうえ、`Card` のように自身の内側へ自身を置けるコンポーネントでは**内側のパーツにも同じ詳細度で当たり、勝敗が出力順で決まる**。現在この種の値はカスタムプロパティ（`--zds-card-padding`）で配っており、その形は維持する
- **セレクタリストのルールの中にネストしない。** `&` は `:is()` と同じ扱いで、`:is()` の詳細度はリスト中の**最大**を採る。`.a, .b#c` のようなリストを親にすると詳細度が変わる。現状そうしたルールに子は無いため、増やさない

## 要件

### R1. 描画結果を 1px も変えない

これは**書き方だけを変えるリファクタ**である。

- 生成されるセレクタと詳細度を変えない
- 宣言の値・順序を変えない
- TSX・テスト・生成される `*.module.css.d.ts` を変えない

**同じ詳細度のルール同士で出力順が入れ替わる箇所は洗い出す。** 入れ子にするとルールの位置がファイル内で移動するため、順序が変わりうる。例えば `StepsItem` の次の 2 つは詳細度が等しく (0,3,0)、現在は後者が勝つ。

```css
.stepsItem__control[data-status='current'] .stepsItem__label { font-weight: … }
.stepsItem[data-orientation='vertical'] .stepsItem__label { white-space: …; overflow-wrap: … }
```

入れ子にすると前者は `.stepsItem__control` の中、後者は `.stepsItem` の中へ移り、**順序が逆転する**（この 2 つは触るプロパティが異なるため無害）。設計フェーズでこの種の逆転をすべて列挙し、宣言が衝突しないことを確認する。衝突するものがあれば、そこだけネスト位置を調整して順序を保つ。

### R2. ネストの規則は機械的に決まる形にする

レビューで迷わないよう、「どこにネストするか」に判断を持ち込まない。

1. **トップレベルのルールはクラス 1 つにつき 1 つ。** ブロックもパーツも横並びのまま置く（R1・C のとおりパーツを子孫化しない）
2. **各ルールは、セレクタの先頭に現れるクラスのルールへネストする。** これで行き先が一意に決まる
   - `.tag[data-variant='red'] .tag__closeButton:hover` → `.tag` の中
   - `.checkbox__input:checked + .checkbox__box` → `.checkbox__input` の中
   - `a.breadcrumb__link:hover` → `.breadcrumb__link` の中（`a&:hover`）
3. **ネストしたセレクタは必ず `&` から書き始める。** 裸の要素セレクタ（`option` / `svg`）も `& option` / `& > svg` と書く。例外は型セレクタが前に付く `a&:hover` だけ
4. **深さはトップレベルから 3 段まで。** 最も深くなるのは `Tag` の `.tag` → `&[data-variant='red']` → `& .tag__closeButton` → `&:hover` で 3 段
5. **`composes` はトップレベルのルール直下の先頭に置く。** ネストした中には書けない（ビルドが落ちる）

### R3. 共通の状態は親側でまとめる

同じ接頭辞のセレクタが並んでいるものは、共通部分を親のネストに括り出してよい。`Button` の変種がその代表である。

```css
/* 変更前 */
.button[data-variant='primary'] { … }
.button[data-variant='primary']:hover { … }
.button[data-variant='primary'][data-selected='true'] { … }
.button[data-variant='primary']:disabled { … }

/* 変更後 */
.button {
  &[data-variant='primary'] {
    …
    &:hover { … }
    &[data-selected='true'] { … }
    &:disabled { … }
  }
}
```

ただし**括り出しのために宣言を移動・統合しない**。「`primary` の 4 ルールに共通する宣言を親へ引き上げる」といった整理は、詳細度と適用範囲が変わるため行わない（R1）。

### R4. コメントは書き換えずに運ぶ

各ファイルのセクション見出し（`/* ---- バリアント */` など）と、判断の理由を書いたコメントは、対応するネストの位置へそのまま移す。**内容は変えない。** 入れ子でセクション見出しが不要になる箇所（ネスト自体が区切りになっている箇所）は削ってよい。

### R5. 対象は `*.module.css` の 19 ファイル

| ファイル | 扱い |
| --- | --- |
| `src/components/**/*.module.css`（19 ファイル） | **対象** |
| `src/styles/mixins.module.css` | 対象だが、3 クラスとも宣言のみでネスト対象が無いため**変更なし** |
| `src/styles/variables*.css` | **対象外**（`pnpm build:tokens` の生成物） |
| `.storybook/preview.css` | **対象外**（独立した 3 セレクタでネスト対象が無い） |

### R6. `AGENTS.md` に規約を追記する

`AGENTS.md` が規約の唯一の正なので、「スタイリング（CSS Modules）」の節に R2 の規則と、C の 2 つの禁止事項を書く。既存の記述のうち、フラットなセレクタを前提にした例（`.button[data-size='sm'] .button__label` など）は入れ子の形に書き換える。

`CLAUDE.md` は `AGENTS.md` を読み込むだけのポインタなので触らない。

### R7. 生成物と配布物

- `*.module.css.d.ts` はクラス名の一覧なので**変化しないはず**である。`pnpm check:css-types` が通ることで確かめる（差分が出たらクラスを増減させてしまっている）
- `dist/AGENTS.md` は `docs/agent-guide.template.md` からの生成物。利用側は CSS の書き方を知る必要が無いため**追記しない**
- `README.md` も変更しない（対応ブラウザの要件が変わらないため）

### R8. 「描画結果を変えていない」ことを機械で確かめる

目視レビューでは 314 ルールの等価性を保証できない。次の 2 段で検査する。

**第 1 段: 出力 CSS の突き合わせ（必須）**

変更前後で CSS をビルドし、フラットに展開して比較する。検証で確かめたとおり、古い `cssTarget` を指定してビルドすると入れ子は `:is()` を挟まず元と同じフラットなセレクタへ戻るため、**純粋な書き換えなら両者は一致する**。

- クラス名のハッシュはファイル内容が変わると変わるため、`css.modules.getJSON` の対応表で元のクラス名へ戻してから比べる
- 完全一致しない場合は差分を 2 種類に分ける。**宣言の増減・変化は不可**（R1 違反）。**ルールの順序だけの入れ替わりは、宣言が衝突しないことを確認したうえで許容する**（R1 のとおり）
- スクリプトはこの spec ディレクトリに置く（`migrate-to-css-modules` の検証スクリプトと同じ扱いで、一度きりの道具として残す）

**第 2 段: 計算後スタイルのスナップショット（推奨）**

`docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts` を再利用し、全ストーリー × ライト / ダークで計算後スタイルを変更前後で突き合わせる。第 1 段が CSS テキストの比較なのに対し、こちらは実際の描画結果を見る。

ただし**ストーリーが既定で描画している状態しか見られない**（hover / focus / checked などは対象外）。これらは第 1 段でカバーする。

**第 3 段: 既存の検査**

`pnpm lint:check` / `pnpm format:check` / `pnpm typecheck` / `pnpm test` / `pnpm test:a11y` / `pnpm check:css-types` / `pnpm verify:dist` をすべて通す。

## 非対象

- **宣言そのものの整理。** 重複の共通化、トークンの付け替え、不要ルールの削除は行わない。入れ子化だけを見たいので混ぜない
- **`composes` の増減。** 共有 mixin の見直しは別の話
- **`:is()` / `:has()` などセレクタの書き換え。** `.stepsItem__control:is(button)` は現状のまま運ぶ
- **CSS のフォーマッタ導入。** 現在 Prettier の対象は `.ts` / `.tsx` のみで、CSS は手で整えている。入れ子のインデント規則を機械で強制する仕組みは、必要なら別 Issue で扱う
- `src/styles/variables*.css` と `.storybook/preview.css`

## 受け入れ条件

1. `src/components/**/*.module.css` の 19 ファイルが R2 の規則で入れ子になっている
2. 出力 CSS をフラットに展開したとき、変更前と宣言が完全に一致する（R8 第 1 段）
3. 順序が入れ替わった箇所がある場合、衝突する宣言が無いことを spec に記録している
4. `AGENTS.md` に入れ子の規約が書かれ、既存の CSS 例が入れ子の形になっている
5. `pnpm lint:check` / `format:check` / `typecheck` / `test` / `test:a11y` / `check:css-types` / `verify:dist` がすべて通る
