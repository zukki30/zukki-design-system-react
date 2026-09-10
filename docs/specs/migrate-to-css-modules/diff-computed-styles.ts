/**
 * snapshot-computed-styles.ts が出した 2 つの JSON を突き合わせる。
 *
 * 使い方:
 *   pnpm exec tsx docs/specs/migrate-to-css-modules/diff-computed-styles.ts \
 *     .tmp/snapshot-before.json .tmp/snapshot-after.json [--stories 'button-*'] [--limit 50]
 *
 * 差分ゼロなら終了コード 0、差分があれば 1 を返す。
 */
import { readFileSync } from 'node:fs';

type ElementSnapshot = { v: number[]; a?: string[] };
type Snapshot = {
  props: string[];
  /** v が指す値の文字列テーブル */
  values: string[];
  stories: Record<string, Record<string, Record<string, ElementSnapshot>>>;
};

/**
 * アニメーション名は CSS Modules がスコープするため必ず変わる。
 * 名前そのものは実装詳細で、`none` かどうかだけを見れば足りる
 */
const SCOPED_PROPS = new Set(['animation-name']);

/**
 * アニメーション中の要素で、フレームによって値が動くプロパティ。
 * 両方のスナップショットでアニメーションが走っているときだけ比較から外す
 */
const ANIMATED_PROPS = new Set(['transform', 'opacity', 'rotate', 'scale', 'translate']);

const argv = process.argv.slice(2);
const files = argv.filter(
  (a) => !a.startsWith('--') && !argv[argv.indexOf(a) - 1]?.startsWith('--')
);
const get = (name: string) => {
  const index = argv.indexOf(`--${name}`);

  return index >= 0 ? argv[index + 1] : undefined;
};

const [beforePath, afterPath] = files;

if (beforePath === undefined || afterPath === undefined) {
  throw new Error('比較する JSON を 2 つ渡してください');
}

const patterns = get('stories')
  ?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
const limit = Number(get('limit') ?? 80);

const matches = (id: string) => {
  if (patterns === undefined) {
    return true;
  }

  return patterns.some((pattern) => {
    const source = `^${pattern
      .split('*')
      .map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('.*')}$`;

    return new RegExp(source).test(id);
  });
};

const before = JSON.parse(readFileSync(beforePath, 'utf8')) as Snapshot;
const after = JSON.parse(readFileSync(afterPath, 'utf8')) as Snapshot;

const differences: string[] = [];
const push = (message: string) => {
  differences.push(message);
};

// プロパティの並びが違うと値配列の対応が取れない。名前で引けるようにする
const indexOfProp = (snapshot: Snapshot) =>
  new Map(snapshot.props.map((prop, index) => [prop, index] as const));

const beforeIndex = indexOfProp(before);
const afterIndex = indexOfProp(after);

const onlyBefore = before.props.filter((p) => !afterIndex.has(p));
const onlyAfter = after.props.filter((p) => !beforeIndex.has(p));

if (onlyBefore.length > 0 || onlyAfter.length > 0) {
  console.log('プロパティの母集合が違います（ブラウザのバージョン差の可能性）');
  console.log(`  before のみ: ${onlyBefore.join(', ') || 'なし'}`);
  console.log(`  after のみ:  ${onlyAfter.join(', ') || 'なし'}`);
  console.log('  共通部分だけを比較します\n');
}

const commonProps = before.props.filter((p) => afterIndex.has(p) && !SCOPED_PROPS.has(p));

const storyIds = [...new Set([...Object.keys(before.stories), ...Object.keys(after.stories)])]
  .filter(matches)
  .sort();

let comparedElements = 0;

for (const id of storyIds) {
  const beforeThemes = before.stories[id];
  const afterThemes = after.stories[id];

  if (beforeThemes === undefined || afterThemes === undefined) {
    push(`${id}: ${beforeThemes === undefined ? 'before' : 'after'} に存在しない`);

    continue;
  }

  for (const theme of [...new Set([...Object.keys(beforeThemes), ...Object.keys(afterThemes)])]) {
    const beforeElements = beforeThemes[theme] ?? {};
    const afterElements = afterThemes[theme] ?? {};
    const paths = [...new Set([...Object.keys(beforeElements), ...Object.keys(afterElements)])];

    for (const path of paths) {
      const b = beforeElements[path];
      const a = afterElements[path];

      if (b === undefined || a === undefined) {
        push(
          `${id} [${theme}] ${path}: ${b === undefined ? 'before' : 'after'} に要素が無い（DOM 構造の差）`
        );

        continue;
      }

      comparedElements++;

      const bothAnimated = (b.a?.length ?? 0) > 0 && (a.a?.length ?? 0) > 0;

      for (const prop of commonProps) {
        if (bothAnimated && ANIMATED_PROPS.has(prop)) {
          continue;
        }

        const bv = before.values[b.v[beforeIndex.get(prop) as number]];
        const av = after.values[a.v[afterIndex.get(prop) as number]];

        if (bv !== av) {
          push(`${id} [${theme}] ${path} { ${prop}: ${bv} → ${av} }`);
        }
      }

      // 名前は比べないが、アニメーションの有無は比べる
      if ((b.a?.length ?? 0) !== (a.a?.length ?? 0)) {
        push(
          `${id} [${theme}] ${path}: アニメーション数 ${b.a?.length ?? 0} → ${a.a?.length ?? 0}`
        );
      }
    }
  }
}

console.log(
  `比較: ${storyIds.length} ストーリー / ${comparedElements} 要素 / ${commonProps.length} プロパティ`
);

if (differences.length === 0) {
  console.log('\n差分はありません');
  process.exit(0);
}

console.log(`\n${differences.length} 件の差分:`);
differences.slice(0, limit).forEach((d) => console.log(`  ${d}`));

if (differences.length > limit) {
  console.log(`  … 他 ${differences.length - limit} 件（--limit で増やせます）`);
}

process.exit(1);
