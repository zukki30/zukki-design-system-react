/**
 * ビルド済み CSS から「擬似クラス・擬似要素・メディアクエリ × 宣言プロパティ名」を
 * 抜き出して突き合わせる。
 *
 * snapshot-computed-styles.ts はストーリーが描画した状態しか見られない。
 * `data-error` のような **属性で表す状態は DOM に出ているのでそちらで拾える** が、
 * `:hover` / `:focus-visible` のような操作しないと現れない状態、`::placeholder` /
 * `::backdrop` のような擬似要素、`prefers-reduced-motion` 下のスタイルは届かない。
 * この道具はその隙間だけを埋める。
 *
 * セレクタ全体の形は比べない。バリアントをクラスから `data-*` 属性へ変えたため、
 * 形の集合は意図的に変わっている。ここで見たいのは「`:disabled` の分岐を落として
 * いないか」であって、ルールの区切り方ではない。
 *
 * 使い方:
 *   pnpm exec tsx docs/specs/migrate-to-css-modules/compare-selector-shapes.ts \
 *     .tmp/styles-before.css dist/styles.css
 */
import { readFileSync } from 'node:fs';

const [beforePath, afterPath] = process.argv.slice(2);

if (beforePath === undefined || afterPath === undefined) {
  throw new Error('比較する CSS を 2 つ渡してください');
}

type Rule = { media: string; selector: string; declarations: string };

/**
 * ルールを列挙する。ネストした `@media`（CSS Modules 移行後の書き方）にも入る。
 * `@keyframes` は中身が宣言ではないので畳む
 */
const parseRules = (css: string): Rule[] => {
  const rules: Rule[] = [];

  const walk = (source: string, media: string, selector: string) => {
    let cursor = 0;
    let declarations = '';

    while (cursor < source.length) {
      const open = source.indexOf('{', cursor);

      if (open < 0) {
        declarations += source.slice(cursor);
        break;
      }

      let depth = 1;
      let index = open + 1;

      for (; index < source.length && depth > 0; index++) {
        if (source[index] === '{') {
          depth++;
        } else if (source[index] === '}') {
          depth--;
        }
      }

      const raw = source.slice(cursor, open);
      // ブロックの直前までに書かれていた宣言は、このルール自身のもの
      const lastSemicolon = raw.lastIndexOf(';');

      declarations += lastSemicolon < 0 ? '' : raw.slice(0, lastSemicolon + 1);

      const prelude = (lastSemicolon < 0 ? raw : raw.slice(lastSemicolon + 1)).trim();
      const body = source.slice(open + 1, index - 1);

      if (prelude.startsWith('@keyframes')) {
        rules.push({ media, selector: '@keyframes', declarations: body });
      } else if (prelude.startsWith('@')) {
        walk(body, `${media}${prelude} `, selector);
      } else {
        walk(body, media, selector === '' ? prelude : `${selector} ${prelude}`);
      }

      cursor = index;
    }

    if (declarations.trim() !== '' && selector !== '') {
      rules.push({ media, selector, declarations });
    }
  };

  walk(css, '', '');

  return rules;
};

/**
 * セレクタから擬似クラス・擬似要素だけを取り出す。
 *
 * クラス名は移行前後で対応が付かないため、引数の中身も含めて `C` に伏せる。
 * `.a:hover .b:not(:disabled)` → `:hover` と `:not(:disabled)`
 */
const pseudosOf = (selector: string): string[] => {
  const found: string[] = [];
  const pattern = /::?[a-zA-Z-]+(\([^()]*(?:\([^()]*\)[^()]*)*\))?/g;

  for (const match of selector.matchAll(pattern)) {
    found.push(match[0].replace(/\.[A-Za-z_-][\w-]*/g, 'C').replace(/\s+/g, ' '));
  }

  return found;
};

/**
 * セレクタリストをトップレベルのカンマで分割する。
 *
 * 中身が同じルールは minifier が `.a, .b { … }` へまとめるため、ルール単位で
 * 数えると片方を取りこぼす。`:not(a, b)` の中のカンマでは切らない
 */
const splitSelectorList = (selector: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = '';

  for (const char of selector) {
    if (char === '(') {
      depth++;
    } else if (char === ')') {
      depth--;
    }

    if (char === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  parts.push(current);

  return parts.map((part) => part.trim()).filter(Boolean);
};

/** 宣言からプロパティ名だけを取り出す（値は比べない） */
const propertiesOf = (declarations: string) =>
  [...declarations.matchAll(/(^|;)\s*([-a-zA-Z]+)\s*:/g)]
    .map((m) => m[2])
    .filter((name) => !name.startsWith('--'));

/**
 * 「状態 × プロパティ」の多重集合を作る。
 * 擬似クラスもメディアクエリも持たないルールは、計算後スタイルの突き合わせが
 * 見ているので対象外にする
 */
const countStates = (path: string) => {
  const counts = new Map<string, number>();

  for (const rule of parseRules(readFileSync(path, 'utf8'))) {
    const media = rule.media.trim().replace(/\s+/g, '');
    const properties = propertiesOf(rule.declarations);

    for (const selector of splitSelectorList(rule.selector)) {
      const pseudos = pseudosOf(selector);

      if (pseudos.length === 0 && media === '') {
        continue;
      }

      const state = [media, ...pseudos.sort()].filter(Boolean).join(' ');

      for (const property of properties) {
        const key = `${state} → ${property}`;

        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
    }
  }

  return counts;
};

const before = countStates(beforePath);
const after = countStates(afterPath);
const allKeys = [...new Set([...before.keys(), ...after.keys()])].sort();

const differences: string[] = [];

for (const key of allKeys) {
  const b = before.get(key) ?? 0;
  const a = after.get(key) ?? 0;

  if (b !== a) {
    differences.push(`${String(b).padStart(3)} → ${String(a).padStart(3)}   ${key}`);
  }
}

const total = (counts: Map<string, number>) => [...counts.values()].reduce((s, n) => s + n, 0);

console.log(
  `before: ${before.size} 種 / ${total(before)} 件、after: ${after.size} 種 / ${total(after)} 件`
);

if (differences.length === 0) {
  console.log('\n「状態 × プロパティ」の組み合わせに差分はありません');
  process.exit(0);
}

console.log(`\n${differences.length} 件の差分:`);
differences.forEach((d) => console.log(`  ${d}`));

process.exit(1);
