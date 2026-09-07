/**
 * ビルドした配布物が利用側から使える形になっているかを検査する。
 *
 * 設定は一度直せば終わるが、戻してしまったときに黙って壊れる箇所がある。
 * とくに React の外部化と light-dark() の保持は、ビルドが成功したままでも
 * 壊れるため機械で見る。
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const DIST = join(ROOT, 'dist');

const failures: string[] = [];

const check = (label: string, ok: boolean, detail: string) => {
  console.log(`  ${ok ? '✅' : '❌'} ${label}${detail ? ` — ${detail}` : ''}`);

  if (!ok) {
    failures.push(label);
  }
};

const read = (name: string) => readFileSync(join(DIST, name), 'utf8');

const countOf = (haystack: string, needle: string) => haystack.split(needle).length - 1;

type Scheme = 'light' | 'dark';

console.log('配布物の検査');

// 1. 必要なファイルが揃っている
const required = [
  'zukki-design-system.js',
  'zukki-design-system.cjs',
  'main.d.ts',
  'styles.css',
  'styles-light.css',
  'styles-dark.css',
  // TypeScript 6 は副作用 import の型解決を既定で検査する。
  // 宣言が無いと利用側で `import 'zukki-design-system/styles.css'` が TS2882 になる
  'styles.css.d.ts',
  'styles-light.css.d.ts',
  'styles-dark.css.d.ts',
  'AGENTS.md',
];

for (const file of required) {
  check(`${file} がある`, existsSync(join(DIST, file)), '');
}

if (failures.length > 0) {
  console.error('\n必要なファイルが足りないため、以降の検査を行えません');
  process.exit(1);
}

const esm = read('zukki-design-system.js');
const cjs = read('zukki-design-system.cjs');

// 2. React が外部化されている。
// useSyncExternalStore は React 本体の実装にしか現れないため、混入の指標になる。
// クォートや空白は最適化の設定で変わりうるため、参照の検出は正規表現で行う
check('ESM に React 実装が混入していない', countOf(esm, 'useSyncExternalStore') === 0, '');
check('CJS に React 実装が混入していない', countOf(cjs, 'useSyncExternalStore') === 0, '');
check('ESM が react を import している', /from\s*["']react["']/.test(esm), '');
check('CJS が react を require している', /require\(\s*["']react["']\s*\)/.test(cjs), '');

// 3. 型宣言が @/ エイリアスを残していない（利用側で解決できなくなる）
const dts = read('main.d.ts');

check('main.d.ts にエイリアスが残っていない', !/from\s*["']@\//.test(dts), '');

// 4. 配色の 3 種類が意図どおりになっている
const styles = read('styles.css');
const light = read('styles-light.css');
const dark = read('styles-dark.css');

check('既定 CSS が light-dark() を保持している', countOf(styles, 'light-dark(') > 0, `${countOf(styles, 'light-dark(')} 箇所`);
check('light 版に light-dark() が残っていない', countOf(light, 'light-dark(') === 0, '');
check('dark 版に light-dark() が残っていない', countOf(dark, 'light-dark(') === 0, '');

// 固定版は color-scheme も固定していないと、UA が描画する部分だけ OS 設定に従ってしまう。
// 空白の入り方は最適化の設定で変わりうるので正規表現で見る
const hasFixedScheme = (css: string, scheme: Scheme) =>
  new RegExp(`color-scheme\\s*:\\s*${scheme}\\s*[;}]`).test(css) &&
  !/color-scheme\s*:\s*light\s+dark/.test(css);

check('light 版の color-scheme が light に固定されている', hasFixedScheme(light, 'light'), '');
check('dark 版の color-scheme が dark に固定されている', hasFixedScheme(dark, 'dark'), '');

// 5. 固定版が実際に異なる値を持っている（同じなら派生生成が効いていない）
const surfaceOf = (css: string) => /--color-surface-raised\s*:\s*([^;}]*)/.exec(css)?.[1]?.trim();

check(
  'light 版と dark 版で値が異なる',
  surfaceOf(light) !== surfaceOf(dark),
  `light=${surfaceOf(light)} / dark=${surfaceOf(dark)}`
);

// 6. 配布物に開発用のファイルが混ざっていない
const packed = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json', '--ignore-scripts'], {
    encoding: 'utf8',
    cwd: ROOT,
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

// 7. 公開している型が利用側から名指しできる。
//
// 文字列一致では足りない。「main.d.ts に名前が現れる」ことと「利用側から
// 解決できる」ことは別物で、barrel の再 export が抜けていれば前者は通ってしまう。
// そのため tsc に実際に解決させる
const componentNames = readdirSync(join(ROOT, 'src', 'components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const probeDir = join(ROOT, 'node_modules', '.tmp', 'probes');
mkdirSync(probeDir, { recursive: true });

// probe は node_modules 配下に置くため、dist への相対パスを算出する
const distMainSpecifier = relative(probeDir, join(DIST, 'main')).split(sep).join('/');

// コンポーネントが増えれば probe も自動的に増えるため、公開し忘れが必ず落ちる
const propsTypes = componentNames.map((name) => `${name}Props`);
const generatedProbe = [
  '// scripts/verify-dist.ts が生成する。手で編集しない',
  `import type {\n${propsTypes.map((t) => `  ${t},`).join('\n')}\n} from '${distMainSpecifier}';`,
  '',
  ...propsTypes.map((t, i) => `type _${i} = ${t};`),
  '',
  `export type Probe = [${propsTypes.map((_, i) => `_${i}`).join(', ')}];`,
  '',
].join('\n');

const generatedProbePath = join(probeDir, 'props.ts');
writeFileSync(generatedProbePath, generatedProbe);

// 手で書いた probe。受け入れ条件を @ts-expect-error で固定している
const usageProbePath = join(ROOT, 'scripts', 'probes', 'usage.tsx');

// --ignoreConfig が無いと、ファイルを直接指定したときに repo の tsconfig.json を
// 見つけて TS5112 になる（TypeScript 6）
const tscArgs = [
  'tsc',
  '--ignoreConfig',
  '--noEmit',
  '--skipLibCheck',
  '--strict',
  '--jsx',
  'react-jsx',
  '--moduleResolution',
  'bundler',
  '--module',
  'esnext',
  '--target',
  'es2022',
  '--lib',
  'es2022,dom,dom.iterable',
  generatedProbePath,
  usageProbePath,
];

let typeProbeOutput = '';
let typeProbeOk = true;

try {
  execFileSync('pnpm', ['exec', ...tscArgs], { encoding: 'utf8', cwd: ROOT, stdio: 'pipe' });
} catch (error) {
  typeProbeOk = false;
  typeProbeOutput = (error as { stdout?: string }).stdout ?? String(error);
}

check(
  `${componentNames.length} コンポーネントの Props 型が利用側から解決できる`,
  typeProbeOk,
  typeProbeOk ? '' : '下記参照'
);

if (!typeProbeOk) {
  console.log(
    typeProbeOutput
      .split('\n')
      .filter(Boolean)
      .slice(0, 20)
      .map((line) => `     ${line}`)
      .join('\n')
  );
}

// 8. 利用側エージェント向けのガイドが、現在のソースを反映している。
//
// 生成物なので理屈のうえでは常に最新だが、build の実行順が崩れて古いものが
// 残る事故はありうる。中身がソースと揃っているかまで見る
const guide = read('AGENTS.md');

check('AGENTS.md にプレースホルダが残っていない', !/\{\{[A-Z_]+\}\}/.test(guide), '');

const missingInGuide = componentNames.filter((name) => !guide.includes(`\`${name}\``));

check(
  'AGENTS.md に全コンポーネントが載っている',
  missingInGuide.length === 0,
  missingInGuide.length === 0 ? `${componentNames.length} 件` : `不足: ${missingInGuide.join(', ')}`
);

const iconNames = [
  ...readFileSync(join(ROOT, 'src', 'components', 'Icon', 'types.ts'), 'utf8')
    .replace(/[\s\S]*export const iconNames = \[/, '')
    .replace(/\][\s\S]*/, '')
    .matchAll(/'([^']+)'/g),
].map((m) => m[1]);

const missingIcons = iconNames.filter((name) => !guide.includes(`\`${name}\``));

check(
  'AGENTS.md に全アイコン名が載っている',
  missingIcons.length === 0,
  missingIcons.length === 0 ? `${iconNames.length} 件` : `不足: ${missingIcons.join(', ')}`
);

// 9. README の一覧が古くなっていない。
//
// README は開発者向けの節も含むため生成の対象にしない。代わりに、追加した
// コンポーネントを書き忘れたときに落ちるようにする
const readme = readFileSync(join(ROOT, 'README.md'), 'utf8');
const missingInReadme = componentNames.filter((name) => !readme.includes(`\`${name}\``));

check(
  'README に全コンポーネントが載っている',
  missingInReadme.length === 0,
  missingInReadme.length === 0 ? `${componentNames.length} 件` : `不足: ${missingInReadme.join(', ')}`
);

if (failures.length > 0) {
  console.error(`\n${failures.length} 件の問題があります:`);
  failures.forEach((f) => console.error(`  - ${f}`));
  process.exit(1);
}

console.log('\nすべての検査を通過しました');
