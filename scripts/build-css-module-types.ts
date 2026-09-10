/**
 * `*.module.css` の隣に型宣言（`*.module.css.d.ts`）を生成する。
 *
 * これが無いと `vite/client` の `{ readonly [key: string]: string }` が効いてしまい、
 * `styles.buttonn` のような綴り違いが型エラーにならず、黙って「クラス未適用」になる。
 * Vanilla Extract では export された値だったので型で守られていた箇所であり、
 * CSS Modules 化で失う唯一の安全性がここなので機械で埋める。
 *
 * クラス名は **Vite の `css.modules.getJSON` から受け取る**。正規表現で CSS を
 * 掻き集める方式にすると `url()` や `content` の中身を拾ったり取りこぼしたりし、
 * 失敗しても「クラスが 1 つ足りない .d.ts」が静かに出来上がってしまう。
 * 実ビルドと同じ経路を通せば `composes` の扱いも含めて必ず一致する。
 *
 * 生成物はコミットする（`src/styles/variables.css` などと同じ扱い）。
 * エディタが追加のビルド無しで型を引けるようにするため。
 *
 * 使い方:
 *   pnpm build:css-types           生成して書き出す
 *   pnpm check:css-types           生成結果と既存を比べ、差があれば異常終了する
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

import { build } from 'vite';

import { ROOT } from './lib/sources';

const SRC = join(ROOT, 'src');
const TMP = join(ROOT, '.tmp', 'css-module-types');

const isCheck = process.argv.includes('--check');

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

const files = findModuleCss(SRC);

if (files.length === 0) {
  console.log('*.module.css が見つかりませんでした');
  process.exit(0);
}

// Vite に全ファイルを読ませるための一時エントリ。
// CSS を直接 lib.entry に渡すことはできないため、import する JS を挟む
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

const collected = new Map<string, string[]>();

await build({
  configFile: false,
  logLevel: 'error',
  css: {
    modules: {
      getJSON: (cssFileName, json) => {
        collected.set(resolve(cssFileName), Object.keys(json));
      },
    },
  },
  build: {
    write: false,
    lib: { entry, formats: ['es'] },
  },
});

rmSync(TMP, { recursive: true, force: true });

/**
 * `.d.ts` の中身を作る。
 *
 * 名前は `X.module.css.d.ts`。TypeScript はこの形式をコンパイラオプション無しで
 * 解決し、`vite/client` の索引シグネチャより優先する。
 * TypeScript 5.0 以降の `X.module.d.css.ts` 形式は `allowArbitraryExtensions` が要る
 */
const declarationOf = (classNames: string[]) =>
  [
    '// このファイルは自動生成されています。直接編集しないでください。',
    'declare const styles: {',
    ...classNames.sort().map((name) => `  readonly ${name}: string;`),
    '};',
    'export default styles;',
    '',
  ].join('\n');

const stale: string[] = [];
let written = 0;

for (const file of files) {
  const classNames = collected.get(resolve(file));

  if (classNames === undefined) {
    throw new Error(`${relative(ROOT, file)} のクラス名を取得できませんでした`);
  }

  const path = `${file}.d.ts`;
  const next = declarationOf(classNames);

  let current: string | undefined;

  try {
    current = readFileSync(path, 'utf8');
  } catch {
    current = undefined;
  }

  if (current === next) {
    continue;
  }

  if (isCheck) {
    stale.push(relative(ROOT, path));

    continue;
  }

  writeFileSync(path, next);
  written++;
}

if (isCheck) {
  if (stale.length > 0) {
    console.error(`${stale.length} 件の型宣言が古くなっています:`);
    stale.forEach((path) => console.error(`  - ${path}`));
    console.error('\npnpm build:css-types を実行してコミットしてください');
    process.exit(1);
  }

  console.log(`${files.length} 件の型宣言は最新です`);
  process.exit(0);
}

console.log(`${files.length} 件の *.module.css を検査し、${written} 件の型宣言を更新しました`);
