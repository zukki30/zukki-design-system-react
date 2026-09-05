/**
 * ビルドした CSS から、配布する 3 種類のスタイルシートを作る。
 *
 * - styles.css       … 既定。light-dark() を保持し、color-scheme に従って解決される
 * - styles-light.css … ライト固定
 * - styles-dark.css  … ダーク固定
 *
 * 固定版は既定版から機械的に導出する。コンポーネントが参照しているのは
 * createGlobalTheme が生成するハッシュ変数（--_xxx）で、その定義には値が
 * 直接埋め込まれている。意味的な変数（--color-focus）を差し替えても
 * コンポーネントの見た目は変わらないため、値そのものを解決する必要がある。
 */
import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');
const BUILT = join(DIST, 'zukki-design-system.css');

type Scheme = 'light' | 'dark';

const LIGHT_DARK = 'light-dark(';

/**
 * `light-dark(a, b)` を配色に応じて `a` または `b` へ解決する。
 *
 * 引数には `var(--x, fallback)` のように関数やカンマが入れ子になるため、
 * 括弧の深さを数えて最上位のカンマだけで分割する。
 */
const resolveLightDark = (css: string, scheme: Scheme): string => {
  let result = '';
  let cursor = 0;

  while (true) {
    const start = css.indexOf(LIGHT_DARK, cursor);

    if (start < 0) {
      result += css.slice(cursor);

      return result;
    }

    result += css.slice(cursor, start);

    const argsStart = start + LIGHT_DARK.length;
    let depth = 1;
    let separator = -1;
    let index = argsStart;

    for (; index < css.length; index++) {
      const char = css[index];

      switch (char) {
        case '(':
          depth++;
          break;
        case ')':
          depth--;
          break;
        case ',':
          if (depth === 1 && separator < 0) {
            separator = index;
          }
          break;
      }

      if (depth === 0) {
        break;
      }
    }

    if (depth !== 0 || separator < 0) {
      throw new Error(`light-dark() の対応する括弧が見つからない（位置 ${start}）`);
    }

    const light = css.slice(argsStart, separator).trim();
    const dark = css.slice(separator + 1, index).trim();

    result += scheme === 'light' ? light : dark;
    cursor = index + 1;
  }
};

/**
 * 配色を固定した CSS を作る。
 *
 * color-scheme も併せて固定する。これを残すとフォームコントロールなど
 * UA が描画する部分だけが OS の設定に従い、指定した配色と食い違う。
 */
const buildVariant = (css: string, scheme: Scheme): string => {
  const resolved = resolveLightDark(css, scheme).replaceAll(
    'color-scheme:light dark',
    `color-scheme:${scheme}`
  );

  const remaining = resolved.split(LIGHT_DARK).length - 1;

  if (remaining > 0) {
    throw new Error(`${scheme} 版に light-dark() が ${remaining} 箇所残っている`);
  }

  return resolved;
};

const source = readFileSync(BUILT, 'utf8');

// exports のキー（./styles.css）と実ファイル名を揃える。
// lib モードでは CSS の出力名を直接指定できないため、ここでリネームする
renameSync(BUILT, join(DIST, 'styles.css'));

for (const scheme of ['light', 'dark'] as const) {
  writeFileSync(join(DIST, `styles-${scheme}.css`), buildVariant(source, scheme));
}

console.log('styles.css / styles-light.css / styles-dark.css を出力しました');
