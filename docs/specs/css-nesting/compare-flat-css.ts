/**
 * CSS の入れ子化（Issue #117）で「出力される CSS を変えていない」ことを確かめる。
 *
 * 入れ子化は書き方だけを変えるリファクタなので、展開後の CSS は変更前と一致するはずである。
 * ただし 314 ルールの等価性を目視で保証することはできないため、機械で突き合わせる。
 *
 * **原理。** 入れ子に未対応の `cssTarget` を指定してビルドすると、esbuild が入れ子を
 * `:is()` を挟まずフラットなセレクタへ展開する（`a&:hover` も `a.link:hover` に戻る）。
 * つまり「入れ子で書いた CSS」と「フラットで書いた CSS」を同じ土俵に乗せられる。
 *
 * クラス名は `css.modules.getJSON` から受け取った対応表で元の名前へ戻す。ハッシュは
 * ファイルの内容から決まるため、書き換えると必ず変わってしまうためである。
 *
 * 使い方:
 *   pnpm exec tsx docs/specs/css-nesting/compare-flat-css.ts --out .tmp/flat-before.json
 *   （書き換え）
 *   pnpm exec tsx docs/specs/css-nesting/compare-flat-css.ts --out .tmp/flat-after.json
 *   pnpm exec tsx docs/specs/css-nesting/compare-flat-css.ts --compare .tmp/flat-before.json .tmp/flat-after.json
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';

import { build } from 'vite';

const ROOT = resolve(import.meta.dirname, '../../..');
const SRC = join(ROOT, 'src');
const TMP = join(ROOT, '.tmp', 'css-nesting-compare');

/** ルール 1 つぶん。セレクタリストは 1 本ずつに分解して持つ */
type Rule = {
  /** セレクタ 1 本、または at-rule のプレリュード */
  selector: string;
  /** 宣言。`prop: value` の配列。at-rule は中身を 1 要素として持つ */
  declarations: string[];
  /** 元の CSS で何番目のブロックだったか。順序の比較に使う */
  block: number;
};

// ---------------------------------------------------------------- CSS を作る

/** `src` 配下の `*.module.css` を集める */
const findModuleCss = (dir: string): string[] => {
  const found: string[] = [];

  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);

    if (statSync(path).isDirectory()) {
      found.push(...findModuleCss(path));
    } else if (entry.endsWith('.module.css')) {
      found.push(path);
    }
  }

  return found.sort();
};

/**
 * 全 `*.module.css` をビルドし、フラットに展開した CSS と
 * 「生成されたクラス名 → 元のクラス名」の対応表を返す。
 */
const buildFlatCss = async () => {
  const files = findModuleCss(SRC);

  mkdirSync(TMP, { recursive: true });

  const entry = join(TMP, 'entry.js');

  writeFileSync(
    entry,
    files
      .map(
        (file, index) =>
          `import s${index} from ${JSON.stringify(file)};\nexport const e${index} = s${index};`
      )
      .join('\n')
  );

  /** 生成名 → 元のクラス名 */
  const names = new Map<string, string>();
  /** 元のクラス名 → それを持つファイルの集合（重複したときの曖昧さ回避に使う） */
  const owners = new Map<string, Set<string>>();

  const output = await build({
    // vite.config.ts は読まない。dts など型宣言の生成に不要なプラグインまで走ってしまう
    configFile: false,
    logLevel: 'error',
    css: {
      modules: {
        getJSON: (cssFileName, json) => {
          for (const [original, generated] of Object.entries(json)) {
            // composes があると生成名が空白区切りで複数になる。先頭がそのクラス自身の
            // 生成名で、後ろは composes 先のもの。後ろは定義元のファイルが登録するため、
            // ここで拾うと `truncate` を `tag__label` として記録してしまう
            const tokens = generated.split(/\s+/).filter(Boolean);
            const own = tokens.find((token) => token.startsWith(`_${original}_`)) ?? tokens[0];

            names.set(own, original);

            const set = owners.get(original) ?? new Set<string>();

            set.add(basename(cssFileName));
            owners.set(original, set);
          }
        },
      },
    },
    build: {
      write: false,
      // 入れ子に未対応のターゲットを指定して esbuild に展開させる。
      // minify を切ると CSS の変換自体が走らず、入れ子のまま出てくる
      minify: true,
      cssTarget: ['chrome100'],
      lib: { entry, formats: ['es'] },
    },
  });

  rmSync(TMP, { recursive: true, force: true });

  const chunks = Array.isArray(output) ? output : [output];
  const css = chunks
    .flatMap((chunk) => ('output' in chunk ? chunk.output : []))
    .filter((asset) => asset.type === 'asset' && asset.fileName.endsWith('.css'))
    .map((asset) => String(asset.type === 'asset' ? asset.source : ''))
    .join('\n');

  if (css.length === 0) {
    throw new Error('CSS が出力されませんでした');
  }

  return { css, names, owners };
};

// ---------------------------------------------------------------- CSS を分解する

/** 波括弧の対応を見てトップレベルのブロックへ分ける */
const splitBlocks = (css: string) => {
  const blocks: { prelude: string; body: string }[] = [];

  let depth = 0;
  let prelude = '';
  let body = '';

  for (const char of css) {
    if (char === '{') {
      depth++;

      if (depth === 1) {
        body = '';
      } else {
        body += char;
      }

      continue;
    }

    if (char === '}') {
      depth--;

      if (depth === 0) {
        blocks.push({ prelude: prelude.trim(), body });
        prelude = '';
        body = '';
      } else {
        body += char;
      }

      continue;
    }

    if (depth === 0) {
      prelude += char;
    } else {
      body += char;
    }
  }

  return blocks;
};

/** 宣言を `prop: value` の配列にする。`url(…)` などの括弧内にあるセミコロンは無視する */
const splitDeclarations = (body: string) => {
  const declarations: string[] = [];

  let depth = 0;
  let current = '';

  for (const char of body) {
    if (char === '(') depth++;
    if (char === ')') depth--;

    if (char === ';' && depth === 0) {
      declarations.push(current.trim());
      current = '';

      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    declarations.push(current.trim());
  }

  return declarations;
};

/** カンマで区切る。`:not(.a, .b)` のような括弧内のカンマは無視する */
const splitSelectorList = (selector: string) => {
  const list: string[] = [];

  let depth = 0;
  let current = '';

  for (const char of selector) {
    if (char === '(' || char === '[') depth++;
    if (char === ')' || char === ']') depth--;

    if (char === ',' && depth === 0) {
      list.push(current.trim());
      current = '';

      continue;
    }

    current += char;
  }

  if (current.trim().length > 0) {
    list.push(current.trim());
  }

  return list;
};

/**
 * 出力 CSS を Rule の配列にする。
 *
 * セレクタリストは 1 本ずつに分解する。esbuild は宣言が同じ隣接ルールをまとめることが
 * あり、入れ子化で隣接関係が変わるとまとめ方だけが変わってしまうためである
 * （`.a,.b{x}` と `.a{x}.b{x}` は等価なので、分解して同じ形に正規化する）。
 */
const toRules = (css: string, normalize: (text: string) => string): Rule[] => {
  const rules: Rule[] = [];

  splitBlocks(css).forEach(({ prelude, body }, block) => {
    const selector = normalize(prelude);

    if (selector.startsWith('@')) {
      // at-rule は中身ごと 1 要素として持つ。入れ子化で中身が変わることは無い
      rules.push({ selector, declarations: [normalize(body).trim()], block });

      return;
    }

    const declarations = splitDeclarations(normalize(body));

    for (const one of splitSelectorList(selector)) {
      rules.push({ selector: one, declarations, block });
    }
  });

  return rules;
};

// ---------------------------------------------------------------- 順序の判定

/**
 * セレクタ 1 本の詳細度を `[b, c]` で返す（id は使っていないので a は見ない）。
 *
 * `:not()` / `:is()` / `:has()` は中身の最大を採る。`:where()` は 0
 */
const specificityOf = (selector: string): [number, number] => {
  let rest = selector;
  let b = 0;
  let c = 0;

  rest = rest.replace(/:(not|is|has|where)\(([^()]*)\)/g, (_, name: string, inner: string) => {
    if (name !== 'where') {
      const inners = splitSelectorList(inner).map((one) => specificityOf(one));
      const max = inners.reduce<[number, number]>(
        (acc, one) => (one[0] * 100 + one[1] > acc[0] * 100 + acc[1] ? one : acc),
        [0, 0]
      );

      b += max[0];
      c += max[1];
    }

    return ' ';
  });

  b += (rest.match(/\.[A-Za-z0-9_-]+/g) ?? []).length;
  b += (rest.match(/\[[^\]]*\]/g) ?? []).length;
  b += (rest.match(/(?<!:):[a-z-]+(?![a-z-]*\()/g) ?? []).length;
  c += (rest.match(/::[a-z-]+/g) ?? []).length;
  c += (rest.match(/(^|[\s>+~])([a-z][a-z0-9]*)/g) ?? []).length;

  return [b, c];
};

/** スタイルが当たる要素（一番右の複合セレクタ）が持つクラス */
const subjectClassesOf = (selector: string) => {
  const last = selector.trim().split(/[\s>+~]+/).pop() ?? '';

  return new Set(last.match(/\.[A-Za-z0-9_-]+/g) ?? []);
};

const propertiesOf = (declarations: string[]) =>
  new Set(declarations.map((declaration) => declaration.split(':')[0].trim()));

/**
 * 順序が入れ替わったペアのうち、実際に勝敗が変わりうるものを返す。
 *
 * 次のいずれかなら、順序が変わっても描画結果は変わらない。
 *   1. 詳細度が違う（勝敗は詳細度で決まる）
 *   2. 当たる要素が違う（そもそも競合しない）
 *   3. 触るプロパティが重ならない
 */
const conflictingSwaps = (before: Rule[], after: Rule[]) => {
  const keyOf = (rule: Rule) => `${rule.selector} ${rule.declarations.join(';')}`;

  const afterIndex = new Map<string, number>();

  after.forEach((rule, index) => {
    const key = keyOf(rule);

    // 同じ内容のルールが複数あるときは最初の位置を使う
    if (!afterIndex.has(key)) {
      afterIndex.set(key, index);
    }
  });

  const common = before.filter((rule) => afterIndex.has(keyOf(rule)));
  const conflicts: { a: Rule; b: Rule; specificity: [number, number]; shared: string[] }[] = [];
  let swaps = 0;

  for (let i = 0; i < common.length; i++) {
    for (let j = i + 1; j < common.length; j++) {
      const a = common[i];
      const b = common[j];

      if ((afterIndex.get(keyOf(a)) ?? 0) <= (afterIndex.get(keyOf(b)) ?? 0)) {
        continue;
      }

      swaps++;

      const specificityA = specificityOf(a.selector);
      const specificityB = specificityOf(b.selector);

      if (specificityA[0] !== specificityB[0] || specificityA[1] !== specificityB[1]) {
        continue;
      }

      const subjectsA = subjectClassesOf(a.selector);
      const subjectsB = subjectClassesOf(b.selector);

      if (![...subjectsA].some((one) => subjectsB.has(one))) {
        continue;
      }

      const propertiesB = propertiesOf(b.declarations);
      const shared = [...propertiesOf(a.declarations)].filter((one) => propertiesB.has(one));

      if (shared.length > 0) {
        conflicts.push({ a, b, specificity: specificityA, shared });
      }
    }
  }

  return { swaps, conflicts };
};

// ---------------------------------------------------------------- 実行

const argv = process.argv.slice(2);

if (argv[0] === '--out') {
  const out = argv[1];

  if (out === undefined) {
    throw new Error('--out の書き出し先を指定してください');
  }

  const { css, names, owners } = await buildFlatCss();

  /**
   * 生成名（`_button__label_1fx9s_12`）を元の名前へ戻す。
   *
   * クラス名は getJSON の対応表で戻す。`@keyframes` の名前も CSS Modules が
   * 同じ形でスコープするが対応表には載らないため、形から元の名前を取り出す
   * （`animation: _fade_piqqe_1` のように宣言の中にも現れる）。
   * 同じクラス名が複数のファイルにあるときだけ、どのファイルのものかを添える
   */
  const normalize = (text: string) =>
    text.replace(/_([A-Za-z0-9_]+)_[A-Za-z0-9]{4,8}_\d+/g, (generated, fallback: string) => {
      const original = names.get(generated) ?? fallback;
      const files = owners.get(original);

      return files !== undefined && files.size > 1
        ? `${original}@${[...files].sort().join('+')}`
        : original;
    });

  const rules = toRules(css, normalize);

  const leftover = rules.filter((rule) =>
    /_[A-Za-z0-9_]+_[A-Za-z0-9]{4,8}_\d+/.test(`${rule.selector}${rule.declarations.join('')}`)
  );

  if (leftover.length > 0) {
    throw new Error(
      `生成名を戻せていないルールが ${leftover.length} 件あります: ${leftover[0].selector}`
    );
  }

  writeFileSync(out, `${JSON.stringify(rules, null, 2)}\n`);
  console.log(`${rules.length} ルールを ${out} に書き出しました`);

  process.exit(0);
}

if (argv[0] === '--compare') {
  const [, beforePath, afterPath] = argv;

  if (beforePath === undefined || afterPath === undefined) {
    throw new Error('--compare <before.json> <after.json> の形で指定してください');
  }

  const before: Rule[] = JSON.parse(readFileSync(beforePath, 'utf8'));
  const after: Rule[] = JSON.parse(readFileSync(afterPath, 'utf8'));

  // 宣言の差分。セレクタごとに「宣言の並び」を集めて突き合わせる
  const collect = (rules: Rule[]) => {
    const map = new Map<string, string[][]>();

    for (const rule of rules) {
      const list = map.get(rule.selector) ?? [];

      list.push(rule.declarations);
      map.set(rule.selector, list);
    }

    return map;
  };

  const beforeMap = collect(before);
  const afterMap = collect(after);
  const selectors = [...new Set([...beforeMap.keys(), ...afterMap.keys()])].sort();

  const differences: string[] = [];

  for (const selector of selectors) {
    const a = JSON.stringify(beforeMap.get(selector) ?? null);
    const b = JSON.stringify(afterMap.get(selector) ?? null);

    if (a !== b) {
      differences.push(`  ${selector}\n    変更前: ${a}\n    変更後: ${b}`);
    }
  }

  if (differences.length > 0) {
    console.error(`宣言に差分があります（${differences.length} セレクタ）:`);
    differences.forEach((one) => console.error(one));

    process.exit(1);
  }

  console.log(`宣言の差分なし（${before.length} ルール / ${selectors.length} セレクタ）`);

  const { swaps, conflicts } = conflictingSwaps(before, after);

  if (conflicts.length > 0) {
    console.error(`\n順序の入れ替わりで勝敗が変わる組が ${conflicts.length} 件あります:`);

    for (const conflict of conflicts) {
      console.error(`  ${conflict.a.selector}`);
      console.error(`  ↕ ${conflict.b.selector}`);
      console.error(
        `    詳細度 (0,${conflict.specificity[0]},${conflict.specificity[1]}) / 衝突: ${conflict.shared.join(', ')}`
      );
    }

    process.exit(1);
  }

  console.log(`順序の入れ替わり ${swaps} 組 / 勝敗が変わる組は 0 件`);

  process.exit(0);
}

console.error('--out <path> または --compare <before> <after> を指定してください');
process.exit(1);
