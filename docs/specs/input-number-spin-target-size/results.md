# 結果: InputNumber のスピンボタンを 24 × 24px 以上にする

対象 Issue: [#116](https://github.com/zukki30/zukki-design-system-react/issues/116)
要件: [`requirements.md`](./requirements.md) / 設計: [`design.md`](./design.md) / 実装計画: [`implementation-plan.md`](./implementation-plan.md)

## やったこと

スピンボタンを縦積み（`▲` / `▼`）から横並び（`−` / `+`）に変え、1 つあたり 24px 以上を寸法そのもので確保した。

| | 変更前 | 変更後 |
| --- | --- | --- |
| `md` | 22 × 20.6px ❌ | **24 × 42.1px** ✅ |
| `sm` | 22 × 16.6px ❌ | **24 × 34.1px** ✅ |

コミットは 4 つ。

| コミット | 内容 |
| --- | --- |
| `feat: add plus icon` | `plus` を `iconNames` へ追加（3 ファイル） |
| `fix: lay out InputNumber spin buttons horizontally to meet WCAG 2.5.8` | CSS の軸を横に倒し、TSX のボタン順序とアイコンを差し替え |
| `test: assert InputNumber spin button target size in the browser` | ストーリーの `play` で実寸を測る |
| `docs: record InputNumber target size fix` | 記録の更新 |

## 実測値（Chromium / deviceScaleFactor 3）

ビルドした Storybook を Playwright で開いて `getBoundingClientRect()` を読んだ値。

```
light/md       → 減らす: 24 x 42.08 / 増やす: 24 x 42.08
light/sm       → 減らす: 24 x 34.08 / 増やす: 24 x 34.08
light/disabled → 減らす: 24 x 42.08 / 増やす: 24 x 42.08
light/error    → 減らす: 24 x 42.08 / 増やす: 24 x 42.08
light/long     → 減らす: 24 x 42.08 / 増やす: 24 x 42.08
dark/md        → 減らす: 24 x 42.08 / 増やす: 24 x 42.08
dark/sm        → 減らす: 24 x 34.08 / 増やす: 24 x 34.08
dark/disabled  → 減らす: 24 x 42.08 / 増やす: 24 x 42.08
dark/error     → 減らす: 24 x 42.08 / 増やす: 24 x 42.08
```

### 計算値と実測値が 0.06px ずれた

要件・設計では行ボックスを `16px × 113.4% = 18.144px` として**フィールド高を 42.144px と書いていたが、実測は 42.08px** だった（`sm` は 34.144px に対し 34.08px）。Chromium が行ボックスの高さを算術どおりには取らないためで、0.06px の差は 24px の判定に一切影響しない。

Issue 本文の「42.1px / 34.1px」は実測側と一致していた。**docs と CSS コメントは実測値に合わせて丸めた表記（42.1px / 34.1px）に直した。** 小数第 2 位まで書くと、ブラウザによって合わなくなる数字を仕様のように見せてしまう。

## 想定と違ったこと

### 1. `play` を足してもテスト件数は増えない

実装計画に「`pnpm test:a11y` のテスト件数が 4 件（2 ストーリー × 2 配色）増える」と書いたが、**これは誤りだった**。ストーリーは元から各プロジェクトで 1 件ずつテストになっており、`play` はその既存テストの中で実行される。件数は 228 のまま変わらない。

件数で確認できない以上、**動いていることの確認は「壊して落とす」しかない**。`--zds-input-number-spin-button-width` を一時的に `20px` にして `pnpm test:a11y` を回したところ、

```
Test Files  2 failed | 36 passed (38)
     Tests  4 failed | 224 passed (228)

FAIL |a11y-light (chromium)| InputNumber.stories.tsx > Default
AssertionError: expected 20 to be greater than or equal to 24
FAIL |a11y-light (chromium)| InputNumber.stories.tsx > Size Sm
FAIL |a11y-dark (chromium)|  InputNumber.stories.tsx > Default
FAIL |a11y-dark (chromium)|  InputNumber.stories.tsx > Size Sm
```

と 4 件が落ちた。ここで初めて「検査を足した」と言える。

### 2. `pnpm verify:dist` はビルドを走らせない

`verify:dist` は `dist/` の中身を検査するだけで、`pnpm build` を含まない。`plus` を足した直後に `verify:dist` だけを回して

```
❌ AGENTS.md に全アイコン名が載っている — 不足: plus
```

で落ちたが、原因は実装ではなく `dist/` が古かったこと。**`verify:dist` の前には必ず `pnpm build` を回す。**

裏を返せば、この検査は正しく効いている。`iconNames` に足したアイコンが `dist/AGENTS.md` に載らなければ落ちる、という経路が実際に動くことを確認できた。

## 設計どおりにいったこと

- **`InputNumber.spec.tsx` は 1 行も変更していない。** DOM 順序を `増やす` → `減らす` から `減らす` → `増やす` へ入れ替えても、`getByLabelText` / `closest` / `parentElement` のどれにも影響しない。485 件が無変更で通ったことが「振る舞いを変えていない」ことの担保になっている
- **`InputNumber.module.css.d.ts` に差分が出なかった。** クラス名（`__spin` / `__spinButton` / `__spinDivider`）を維持したため。`pnpm check:css-types` も通る
- **`−` と `+` の横棒がぴたりと揃う。** `plus` を `baselineMinus` の座標（y 10.998〜12.998、x 5〜19）から組み立てたため

## アイコンサイズを 16 / 14 から 24 / 20 に変えた

要件の時点では現状維持と書いていたが、設計フェーズで変更した。

- `baselineMinus` は 24 の viewBox 中 x 5〜19 しか使わず、**グリフ自身が左右 5px の余白を持つ**。24px で描いても詰まらない
- `Checkbox` の indeterminate は同じ `baselineMinus` を箱いっぱい（`md` 24px / `sm` 20px）で描いている
- 線幅は viewBox 上 2px。16px では 1.33px、14px では 1.17px になり非 Retina でにじむ

16 / 14 は「22 × 20.6px のボタンに収める」ための値で、ボタンが 24 × 42.1px になった時点で前提が消えていた。値は `Input` のアドーンメント（`--zds-input-icon-size`）と揃えた。

## 利用側から見た変更

| 項目 | 変更 |
| --- | --- |
| 見た目 | スピンボタンが縦並び（`▲` / `▼`）から横並び（`−` / `+`）に |
| 幅 | `InputNumber` の全体幅が 27px 広がる（`md` で最小 105px → 132px、`sm` で 89px → 116px） |
| アイコン | `iconNames` に `plus` が増えた（17 → 18 件） |
| 公開 API | `InputNumber` は変更なし（`InputNumberProps` / `InputNumberSize` はそのまま）。ただし **`IconName` に `'plus'` が、`iconNames` に `'plus'` が加わる** |

`IconName` / `iconNames` は `src/main.tsx` から export しているため、アイコンの追加は**公開 API の変更にあたる**（後方互換の追加で、既存の利用側が壊れることはない）。`IconName` を網羅した `switch` や `Record<IconName, …>` を書いている利用側では、型エラーとして `plus` の追加が現れる。

破壊的な API 変更とトークンの再生成はどちらも無い。

## 残した課題

- **長押しによる連続増減は入れていない。** Issue の範囲外。横並びになってボタンが押しやすくなったぶん、大きな値を刻むときの連打は以前と変わらず必要
- **RTL では `−` と `+` の左右が入れ替わる。** `flex-direction: row` が書字方向に従うため。数値入力の慣習として妥当な挙動と判断して特別扱いしていない
- **ボタン高の下限は CSS に書かれていない。** フィールド高（＝ `--font-size-base` と `--line-height-line` とパディングの積み上げ）に追従するため、トークンを変えると静かに 24px を割りうる。これを拾うのが `play` の実寸テストの役割で、**CSS だけを読んでも保証が見えない点は残っている**
