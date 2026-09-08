/**
 * 利用側の AI エージェント向けガイド（dist/AGENTS.md）を生成する。
 *
 * 散文は docs/agent-guide.template.md に手で書き、コンポーネント一覧・アイコン名・
 * 公開している型はソースから差し込む。**ビルドのたびに作り直すため古くならない。**
 *
 * repo 直下ではなく dist/ に出すのは 2 つの理由による。
 * - 直下の AGENTS.md はこのリポジトリで作業する人向けの規約で、配るものではない
 * - verify-dist.ts が「配布物に dist/ 以外が混ざっていないこと」を検査している。
 *   直下に置くとその例外を増やすことになり、開発用ファイルの混入を検知する力が落ちる
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const TEMPLATE = join(ROOT, 'docs', 'agent-guide.template.md');
const OUTPUT = join(ROOT, 'dist', 'AGENTS.md');

/** compound components。パーツを合成して組み立てるもの */
const COMPOUND = new Set(['Card', 'Dialog', 'FormField', 'Steps']);

const template = readFileSync(TEMPLATE, 'utf8');

/**
 * テンプレート冒頭のコメントから `Name: 説明` の対応表を読む。
 * 説明文は生成できないため人が書き、網羅性だけを機械が見る
 */
const readDescriptions = () => {
  const header = /^<!--([\s\S]*?)-->/.exec(template);
  if (header === null) {
    throw new Error('テンプレートの先頭にコメントがありません');
  }

  const body = header[1].split(/^\s*descriptions:\s*$/m)[1];
  if (body === undefined) {
    throw new Error('テンプレートのコメントに descriptions: の行がありません');
  }

  const descriptions = new Map<string, string>();
  for (const line of body.split('\n')) {
    const matched = /^\s*([A-Z][A-Za-z]*)\s*:\s*(.+?)\s*$/.exec(line);
    if (matched !== null) {
      descriptions.set(matched[1], matched[2]);
    }
  }

  return descriptions;
};

const componentNames = readdirSync(join(ROOT, 'src', 'components'), { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const descriptions = readDescriptions();

// テンプレートに説明が無いコンポーネントがあれば止める。
// 一覧だけ増えて説明が空のまま配られるのを防ぐ
const undocumented = componentNames.filter((name) => !descriptions.has(name));
if (undocumented.length > 0) {
  console.error(
    `docs/agent-guide.template.md の descriptions に説明がありません: ${undocumented.join(', ')}`
  );
  process.exit(1);
}

const unknown = [...descriptions.keys()].filter((name) => !componentNames.includes(name));
if (unknown.length > 0) {
  console.error(
    `docs/agent-guide.template.md の descriptions に無いコンポーネントが載っています: ${unknown.join(', ')}`
  );
  process.exit(1);
}

const componentTable = [
  '| コンポーネント | 説明 | 合成 |',
  '| --- | --- | --- |',
  ...componentNames.map(
    (name) => `| \`${name}\` | ${descriptions.get(name)} | ${COMPOUND.has(name) ? '✓' : '' } |`
  ),
].join('\n');

/** src/components/Icon/types.ts の iconNames をそのまま読む */
const readIconNames = () => {
  const source = readFileSync(join(ROOT, 'src', 'components', 'Icon', 'types.ts'), 'utf8');
  const block = /export const iconNames = \[([\s\S]*?)\] as const;/.exec(source);
  if (block === null) {
    throw new Error('src/components/Icon/types.ts から iconNames を読めません');
  }

  return [...block[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);
};

const iconNames = readIconNames();
const iconList = iconNames.map((name) => `\`${name}\``).join(' / ');

/** src/main.tsx の export から、公開している名前を集める */
const readExports = () => {
  const source = readFileSync(join(ROOT, 'src', 'main.tsx'), 'utf8');
  const types = new Set<string>();
  const values = new Set<string>();

  for (const matched of source.matchAll(/export\s+(type\s+)?\{([^}]*)\}/g)) {
    const isTypeOnly = matched[1] !== undefined;
    for (const raw of matched[2].split(',')) {
      const name = raw.replace(/^\s*type\s+/, '').trim();
      if (name === '') {
        continue;
      }

      if (isTypeOnly || raw.trimStart().startsWith('type ')) {
        types.add(name);
      } else {
        values.add(name);
      }
    }
  }

  return {
    types: [...types].sort(),
    values: [...values].sort(),
  };
};

const { types, values } = readExports();

const exportedTypes = [
  '**値**（コンポーネント・フック・定数）',
  '',
  '```',
  values.join(', '),
  '```',
  '',
  '**型**',
  '',
  '```',
  types.join(', '),
  '```',
].join('\n');

const rendered = template
  // 先頭の管理用コメントは配布物に出さない
  .replace(/^<!--[\s\S]*?-->\n+/, '')
  .replace('{{COMPONENTS}}', componentTable)
  .replace('{{ICON_NAMES}}', iconList)
  .replace('{{EXPORTED_TYPES}}', exportedTypes);

const leftover = /\{\{[A-Z_]+\}\}/.exec(rendered);
if (leftover !== null) {
  console.error(`差し込まれていないプレースホルダがあります: ${leftover[0]}`);
  process.exit(1);
}

const distDir = join(ROOT, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

writeFileSync(OUTPUT, rendered);

console.log(
  `AGENTS.md を出力しました（${componentNames.length} コンポーネント / ${iconNames.length} アイコン / 型 ${types.length} 件）`
);
