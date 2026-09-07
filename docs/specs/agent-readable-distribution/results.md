# 結果: 利用側の AI エージェントが正しく使える情報を配布物に載せる

対象 Issue: [#90](https://github.com/zukki30/zukki-design-system-react/issues/90)
要件: [`requirements.md`](./requirements.md) / 設計: [`design.md`](./design.md) / 計画: [`implementation-plan.md`](./implementation-plan.md)

## やったこと

| フェーズ | コミット |
| --- | --- |
| 1. 型の公開 | `feat: export props types and variant unions for all components` |
| 2. 公開漏れの検査 | `test: verify the public type surface against the built dist` |
| 3. ガイドの生成 | `feat: ship a usage guide for agents in the published package` |
| 4. README | `docs: add component list and agent guide pointer to README` |
| 5. 実地検証で見つけた不具合 | `fix: ship type declarations for the distributed CSS entry points` |
| 6. 規約の追記 | `docs: document the generated agent guide in the repository guidelines` |
| 5-4. 検証の反映 | `docs: fill the gaps the consumer-side agent trial exposed` |

## 公開 API の変化

型を 25 件追加した。**削除・改名は 0 件**なので破壊的変更は無い。

| 内容 | 件数 |
| --- | --- |
| Props 型（`ButtonProps` ほか） | 15 |
| 選択肢の union（`ButtonVariant` / `ButtonSize` / `IconButtonVariant` / `IconButtonSize` / `SpinnerVariant`） | 5 |
| アイコン（`IconName` 型 / `iconNames` 値） | 2 |
| 共有型（`ZukkiVariantType`） | 1 |

`dist/main.d.ts` から参照できる名前は **値 26 件 / 型 57 件**になった。

`SizeType` は公開していない。名前が汎用的すぎて利用側の型と衝突するためで、用途は `ButtonSize` / `IconButtonSize` で覆える。公開しない型を props が参照していても型解決は壊れないことを実測で確認した（`ButtonProps['size']` は `'sm' | 'md'` に解決される）。

## 実地検証（FR-7）

`pnpm pack` した tarball を、React 19 + TypeScript 6 の別プロジェクトへ実際に install して確認した。

### 機械的な確認

| 確認項目 | 結果 |
| --- | --- |
| パッケージ名で型が解決できる | ✅ |
| 19 コンポーネントすべての Props 型を名指しできる | ✅ |
| `IconName` / `iconNames` が届く | ✅ 17 件 |
| `variant="danger"` / `size="lg"` が型エラーになる | ✅ |
| `IconButton` の `aria-label` 省略がエラーになる | ✅ |
| `Icon` の存在しない `name` がエラーになる | ✅ |
| `<Dialog title="…">` がエラーになる | ✅ |
| `Card.Title level={1}` がエラーになる | ✅ |
| ESM / CJS の両方で import できる | ✅ |
| `zukki-design-system/AGENTS.md` が `exports` から解決できる | ✅ |
| CSS が `light-dark()` を保持している | ✅ 348 箇所 |
| JSDoc が `.d.ts` に届いている | ✅ |

### エージェントに書かせた検証

ライブラリの中身を知らないエージェントに、`node_modules` だけを情報源として「ユーザー登録フォームのカード」を実装させた。README の案内（利用側の `AGENTS.md` から `dist/AGENTS.md` を読み込ませる）**あり／なしの 2 環境**で行った。

| 要件 FR-7 の確認項目 | 案内なし | 案内あり |
| --- | --- | --- |
| 存在しない `variant` / `size` を書かない | ✅ | ✅ |
| CSS の import を忘れない | ✅ | ✅ |
| compound components を合成で組む | ✅ | ✅ |
| アイコン名を推測で書かない | ✅ | ✅ |
| Props 型を使ってラッパーを書ける | ✅ | ✅ |
| **初回に書いたコードの型エラー** | **0 件** | **0 件** |

**案内が無くてもエージェントは `dist/AGENTS.md` を自力で見つけた。** ただし 1 例で確かめただけなので、README の案内は引き続き有効な保険として残す。

両環境とも、型を疑って `variant="danger"` などをわざと書き、実際にエラーになることを自分で確かめていた。

## 実地検証で見つけた不具合（修正済み）

### CSS の副作用 import が型エラーになっていた

利用側で README のとおり書くと、次のエラーになった。

```
error TS2882: Cannot find module or type declarations for
side-effect import of 'zukki-design-system/styles.css'.
```

TypeScript 6 は副作用 import の型解決を既定で検査する。バンドラの型（`vite/client` など）を読んでいる利用側では表面化しないが、読んでいない場合は必ず落ちる。**README の手順どおりに書いて落ちるため、配布物の欠陥である。**

CSS 3 種それぞれに空の `.d.ts` を出し、`exports` の `types` 条件から引かせて解消した。`verify:dist` の必須ファイル一覧にも加えた。

## エージェント検証で埋めたガイドの不足

**2 環境のエージェントが独立に同じ 3 箇所で詰まり**、型に無い情報を探して配布バンドルと CSS を読んでいた。いずれもガイドに追記した。

| 詰まった点 | 実際の挙動 |
| --- | --- |
| `FormField` の `required` | 注入するのは `aria-required` だけで、**ブラウザのネイティブ検証は効かない**。ガイドに「状態は自動で伝わる」とだけ書いていたのは不正確だった |
| カードの右上への配置 | `Card.Header` は横並びで `Card.Action` が右端に寄る。自前の絶対配置は不要 |
| `Card.Body` の中身が広がらない | `Card.Body` は横並びの flex。幅いっぱいにするには子に `flex: 1` が要る |

## 増えた検査

`pnpm verify:dist` に 5 件足した。CI の `dist` ジョブがそのまま実行する。

| 検査 | 落ちるとき |
| --- | --- |
| 19 コンポーネントの Props 型が利用側から解決できる | コンポーネントを追加して型を公開し忘れたとき |
| `AGENTS.md` にプレースホルダが残っていない | 生成が途中で壊れたとき |
| `AGENTS.md` に全コンポーネントが載っている | テンプレートの `descriptions` に書き忘れたとき |
| `AGENTS.md` に全アイコン名が載っている | アイコンを増やして生成が走っていないとき |
| README に全コンポーネントが載っている | README の一覧に書き忘れたとき |

型の検査は文字列一致ではなく `tsc` で行う。「名前が `main.d.ts` に現れる」ことと「利用側から解決できる」ことは別物で、barrel の再 export が抜けていれば文字列検査は通ってしまうため。

受け入れ条件を固定する probe（`scripts/probes/usage.tsx`）も置いた。`@ts-expect-error` はエラーが出なくなったときに逆にエラーになるため、`size="lg"` が通るようになったら落ちる。

**検査が実際に機能することは、わざと壊して確認した。**

- `dist/main.d.ts` から `ButtonProps` の export を外す → ❌ になる
- README から `Tooltip` の行を消す → ❌ になる

## 最終確認

CI と同じ内容をすべて通した。

| コマンド | 結果 |
| --- | --- |
| `pnpm lint:check` | ✅ |
| `pnpm format:check` | ✅ |
| `pnpm typecheck` | ✅ |
| `pnpm test` | ✅ 437 件 |
| `pnpm test:a11y` | ✅ 208 件 |
| `pnpm build` | ✅ |
| `pnpm verify:dist` | ✅ 全項目 |

## 残った課題

本 spec のスコープ外だが、検証の過程で見えたもの。

### 1. compound components のパーツに JSDoc が届かない

`Card.Action` などパーツ側の JSDoc は `.d.ts` に出ない。

```ts
// dist/components/Card/Card.d.ts
export declare namespace Card {
  var Action: ({ className, ...props }: CardActionProps) => JSX.Element;  // JSDoc 無し
}
```

代入箇所（`Card.Action = CardAction;`）に JSDoc を付けても届かないことを実測で確認した。**エージェントがパーツの役割を知るのに配布バンドルを読まざるを得なかった原因はこれ**である。当面はガイドで補っているが、パーツを名前付きで export するなど別の手が要る。

### 2. `Card.Body` が横並びの flex であること

フォームなど縦積みの内容を入れると、子に `flex: 1` を指定しない限り内容ぶんの幅で止まる。2 環境のエージェントが独立に同じ回避策へ辿り着いた。ガイドには書いたが、**そもそも既定の挙動として妥当かはデザイン判断**であり、本 spec では変えていない（NFR-1）。

### 3. `FormField` の `required` とネイティブ検証

`aria-required` だけを注入する現在の仕様は、支援技術には正しく伝わる一方でブラウザ検証は効かない。意図的な設計と読めるが、利用側が毎回 `<Input required>` を書き足す前提なら、その旨を JSDoc 側にも書いておくほうがよい。

### 4. ガイドが実際に読まれるかの継続確認

1 例では「案内が無くても見つけた」が、モデルやツールが変われば結果は変わる。ライブラリを更新したときに同じ検証を繰り返せる形にしておくと安心できる。
