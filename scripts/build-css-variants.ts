/**
 * ビルドした CSS から、配布する 3 種類のスタイルシートを作る。
 *
 * - styles.css       … 既定。light-dark() を保持し、color-scheme に従って解決される
 * - styles-light.css … ライト固定
 * - styles-dark.css  … ダーク固定
 *
 * ビルド済み CSS は「`:root` の変数定義（src/styles/variables.css 由来）」と
 * 「コンポーネントのスタイル」の 2 つでできている。固定版は前者だけを
 * `variables-light-only.css` / `variables-dark-only.css` に差し替えて作る。
 *
 * コンポーネント側は `:root` を一切使わないため、「`:root { … }` を全部落とす」で
 * 変数定義だけを正確に切り離せる。落とし残しがあれば固定版に light-dark() が
 * 残るので、verify:dist がその場で気づく。
 */
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { ROOT } from './lib/sources';

const DIST = join(ROOT, 'dist');
const STYLES_DIR = join(ROOT, 'src', 'styles');
const BUILT = join(DIST, 'zukki-design-system.css');

type Scheme = 'light' | 'dark';

/**
 * セレクタがちょうど `:root` のルールを本文ごと取り除く。
 *
 * `:root .foo` のような複合セレクタは対象にしない。落とし損ねても
 * 固定版に残るだけで、verify:dist の light-dark() 検査が拾う。
 * 逆に落としすぎるほうが気づきにくいため、一致条件は厳しくしている。
 */
const stripRootRules = (css: string): { rest: string; removed: number } => {
  let result = '';
  let cursor = 0;
  let removed = 0;

  while (true) {
    const start = css.indexOf(':root', cursor);

    if (start < 0) {
      return { rest: result + css.slice(cursor), removed };
    }

    const open = css.indexOf('{', start);
    const selectorTail = open < 0 ? '' : css.slice(start + ':root'.length, open);

    // セレクタが `:root` そのものでなければ触らない
    if (open < 0 || selectorTail.trim() !== '') {
      result += css.slice(cursor, start + ':root'.length);
      cursor = start + ':root'.length;

      continue;
    }

    let depth = 0;
    let index = open;

    for (; index < css.length; index++) {
      if (css[index] === '{') {
        depth++;
      } else if (css[index] === '}') {
        depth--;

        if (depth === 0) {
          break;
        }
      }
    }

    if (depth !== 0) {
      throw new Error(`:root ルールの対応する括弧が見つからない（位置 ${start}）`);
    }

    result += css.slice(cursor, start);
    cursor = index + 1;
    removed++;
  }
};

const source = readFileSync(BUILT, 'utf8');
const { rest: components, removed } = stripRootRules(source);

if (removed === 0) {
  throw new Error(
    'ビルド済み CSS に :root の定義が見つからない。' +
      'src/main.tsx が styles/variables.css を読んでいるか確認すること'
  );
}

// exports のキー（./styles.css）と実ファイル名を揃える。
// lib モードでは CSS の出力名を直接指定できないため、ここでリネームする。
// 既定版はビルド結果そのままで、light-dark() を保持する
renameSync(BUILT, join(DIST, 'styles.css'));

for (const scheme of ['light', 'dark'] as const satisfies Scheme[]) {
  const variables = readFileSync(join(STYLES_DIR, `variables-${scheme}-only.css`), 'utf8');

  writeFileSync(join(DIST, `styles-${scheme}.css`), `${variables}${components}`);
}

// CSS の型宣言も出す。
//
// TypeScript 6 は副作用 import の型解決を既定で検査するため、宣言が無いと
// `import 'zukki-design-system/styles.css'` が TS2882 になる。バンドラの型
// （vite/client など）を読んでいない利用側では、README のとおりに書いただけで
// 型エラーになってしまう。package.json の exports から types として引かせる
for (const name of ['styles.css', 'styles-light.css', 'styles-dark.css']) {
  writeFileSync(
    join(DIST, `${name}.d.ts`),
    '// 副作用 import 専用。値は export しない\nexport {};\n'
  );
}

console.log(
  `styles.css / styles-light.css / styles-dark.css を出力しました（:root ${removed} 件を差し替え）`
);
