/**
 * ビルドした配布物が利用側から使える形になっているかを検査する。
 *
 * 設定は一度直せば終わるが、戻してしまったときに黙って壊れる箇所がある。
 * とくに React の外部化と light-dark() の保持は、ビルドが成功したままでも
 * 壊れるため機械で見る。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DIST = join(import.meta.dirname, '..', 'dist');

const failures: string[] = [];

const check = (label: string, ok: boolean, detail: string) => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);

  if (!ok) {
    failures.push(label);
  }
};

const read = (name: string) => readFileSync(join(DIST, name), 'utf8');

const countOf = (haystack: string, needle: string) => haystack.split(needle).length - 1;

console.log('配布物の検査');

// 1. 必要なファイルが揃っている
const required = [
  'zukki-design-system.es.js',
  'zukki-design-system.umd.js',
  'main.d.ts',
  'styles.css',
  'styles-light.css',
  'styles-dark.css',
];

for (const file of required) {
  check(`${file} がある`, existsSync(join(DIST, file)), '');
}

if (failures.length > 0) {
  console.error('\n必要なファイルが足りないため、以降の検査を行えません');
  process.exit(1);
}

const es = read('zukki-design-system.es.js');
const umd = read('zukki-design-system.umd.js');

// 2. React が外部化されている。
// useSyncExternalStore は React 本体の実装にしか現れないため、混入の指標になる
check('ES に React 実装が混入していない', countOf(es, 'useSyncExternalStore') === 0, '');
check('UMD に React 実装が混入していない', countOf(umd, 'useSyncExternalStore') === 0, '');
check('ES が react を import している', es.includes('from "react"'), '');
check('UMD が react を require している', umd.includes('require("react")'), '');

// 3. 型宣言が @/ エイリアスを残していない（利用側で解決できなくなる）
const dts = read('main.d.ts');

check('main.d.ts にエイリアスが残っていない', !dts.includes("from '@/"), '');

// 4. 配色の 3 種類が意図どおりになっている
const styles = read('styles.css');
const light = read('styles-light.css');
const dark = read('styles-dark.css');

check('既定 CSS が light-dark() を保持している', countOf(styles, 'light-dark(') > 0, `${countOf(styles, 'light-dark(')} 箇所`);
check('light 版に light-dark() が残っていない', countOf(light, 'light-dark(') === 0, '');
check('dark 版に light-dark() が残っていない', countOf(dark, 'light-dark(') === 0, '');

// 固定版は color-scheme も固定していないと、UA が描画する部分だけ OS 設定に従ってしまう
check('light 版の color-scheme が light に固定されている', light.includes('color-scheme:light') && !light.includes('color-scheme:light dark'), '');
check('dark 版の color-scheme が dark に固定されている', dark.includes('color-scheme:dark'), '');

// 5. 固定版が実際に異なる値を持っている（同じなら派生生成が効いていない）
const surfaceOf = (css: string) => /--color-surface-raised:([^;}]*)/.exec(css)?.[1]?.trim();

check(
  'light 版と dark 版で値が異なる',
  surfaceOf(light) !== surfaceOf(dark),
  `light=${surfaceOf(light)} / dark=${surfaceOf(dark)}`
);

// 6. 配布物に開発用のファイルが混ざっていない
const packed = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    encoding: 'utf8',
    cwd: join(import.meta.dirname, '..'),
  })
) as [{ files: { path: string }[] }];

// package.json は npm が files の指定によらず必ず含める
const ALWAYS_PACKED = ['README.md', 'package.json'];

const paths = packed[0].files.map((f) => f.path);
const unwanted = paths.filter((p) => !p.startsWith('dist/') && !ALWAYS_PACKED.includes(p));

check('配布物に開発用のファイルが混ざっていない', unwanted.length === 0, `${paths.length} ファイル`);

if (unwanted.length > 0) {
  console.log(`     混入: ${unwanted.slice(0, 10).join(', ')}`);
}

if (failures.length > 0) {
  console.error(`\n${failures.length} 件の問題があります:`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('\nすべての検査を通過しました');
