/**
 * 全ストーリーを実ブラウザで描画し、要素ごとの計算後スタイルを記録する。
 *
 * Vanilla Extract から CSS Modules への移行（Issue #84）で「描画結果を変えていない」
 * ことを確かめるための一度きりの道具。移行前後で 1 回ずつ実行し、
 * diff-computed-styles.ts で突き合わせる。
 *
 * ビルド済み CSS の差分では確認できない。クラス名も CSS 変数名もハッシュで、
 * 移行前後で対応が付かないためである。
 *
 * 使い方:
 *   pnpm build-storybook
 *   pnpm exec tsx docs/specs/migrate-to-css-modules/snapshot-computed-styles.ts \
 *     --out .tmp/snapshot-before.json [--stories 'button-*,card-*']
 */
import { createReadStream, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';

import { chromium } from 'playwright';

const THEMES = ['light', 'dark'] as const;

type Theme = (typeof THEMES)[number];

/**
 * 要素 1 つぶんの記録。
 *
 * `v` は props と同じ並びの値。ただし同じ値（`rgb(21, 23, 26)` など）が数万回
 * 現れるため、文字列そのものではなく `values` テーブルの添字を持つ。
 * `a` は走っているアニメーション名
 */
type ElementSnapshot = {
  v: number[];
  a?: string[];
};

type Snapshot = {
  props: string[];
  values: string[];
  stories: Record<string, Partial<Record<Theme, Record<string, ElementSnapshot>>>>;
};

// ---------------------------------------------------------------- 引数

const parseArgs = () => {
  const argv = process.argv.slice(2);
  const get = (name: string) => {
    const index = argv.indexOf(`--${name}`);

    return index >= 0 ? argv[index + 1] : undefined;
  };

  const out = get('out');

  if (out === undefined) {
    throw new Error('--out を指定してください');
  }

  return {
    out,
    staticDir: get('static') ?? 'storybook-static',
    port: Number(get('port') ?? 6099),
    // カンマ区切りのグロブ。* のみを扱う
    patterns: get('stories')
      ?.split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  };
};

const matches = (id: string, patterns: string[] | undefined) => {
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

// ---------------------------------------------------------------- 静的配信

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

const serve = (root: string, port: number) => {
  const server = createServer((req, res) => {
    // クエリを落とし、`..` でルート外へ出られないようにする
    const path = normalize(decodeURIComponent((req.url ?? '/').split('?')[0])).replace(
      /^(\.\.[/\\])+/,
      ''
    );
    const file = join(root, path === '/' ? 'index.html' : path);

    if (!existsSync(file) || !file.startsWith(root)) {
      res.writeHead(404).end('not found');

      return;
    }

    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });

  return new Promise<() => Promise<void>>((resolve) => {
    server.listen(port, () => {
      resolve(() => new Promise((done) => server.close(() => done())));
    });
  });
};

// ---------------------------------------------------------------- 収集

/**
 * ページ内で実行して、#storybook-root 配下の要素ごとに計算後スタイルを集める。
 *
 * 要素の識別子は「タグ名 + 兄弟内の位置」を root から連ねたパス。
 * クラス名は移行前後で変わるため使わない。
 */
const collect = () => {
  const root = document.querySelector('#storybook-root');

  if (root === null) {
    return { props: [], elements: {} };
  }

  const first = root.querySelector('*') ?? root;
  const computed = getComputedStyle(first);
  const props: string[] = [];

  for (let i = 0; i < computed.length; i++) {
    const prop = computed[i];

    // カスタムプロパティは描画結果ではなく、移行で名前ごと入れ替わる（ハッシュ変数 →
    // 意味的な変数）。比較しても意味が無いうえ全体の 4 割を占めるため記録しない
    if (!prop.startsWith('--')) {
      props.push(prop);
    }
  }

  const elements: Record<string, { v: string[]; a?: string[] }> = {};

  const walk = (element: Element, path: string) => {
    const style = getComputedStyle(element);
    const animations = element
      .getAnimations()
      .map((animation) => (animation as CSSAnimation).animationName)
      .filter(Boolean);

    elements[path] = {
      v: props.map((prop) => style.getPropertyValue(prop)),
      ...(animations.length > 0 ? { a: animations } : {}),
    };

    const counts: Record<string, number> = {};

    for (const child of Array.from(element.children)) {
      const tag = child.tagName.toLowerCase();

      counts[tag] = (counts[tag] ?? 0) + 1;
      walk(child, `${path}/${tag}[${counts[tag]}]`);
    }
  };

  const counts: Record<string, number> = {};

  for (const child of Array.from(root.children)) {
    const tag = child.tagName.toLowerCase();

    counts[tag] = (counts[tag] ?? 0) + 1;
    walk(child, `${tag}[${counts[tag]}]`);
  }

  return { props, elements };
};

// ---------------------------------------------------------------- 本体

const { out, staticDir, port, patterns } = parseArgs();

if (!existsSync(join(staticDir, 'index.json'))) {
  throw new Error(
    `${staticDir}/index.json がありません。先に pnpm build-storybook を実行してください`
  );
}

const index = JSON.parse(readFileSync(join(staticDir, 'index.json'), 'utf8')) as {
  entries: Record<string, { id: string; type: string }>;
};

const storyIds = Object.values(index.entries)
  .filter((entry) => entry.type === 'story')
  .map((entry) => entry.id)
  .filter((id) => matches(id, patterns))
  .sort();

if (storyIds.length === 0) {
  throw new Error('対象のストーリーがありません');
}

console.log(
  `${storyIds.length} ストーリー × ${THEMES.length} 配色 = ${storyIds.length * THEMES.length} 件`
);

const close = await serve(join(process.cwd(), staticDir), port);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });

// tsx（esbuild）は keepNames を有効にしてトランスパイルするため、page.evaluate に渡す
// 関数の中に __name ヘルパーへの参照が混ざる。ページ側に無害な実体を用意しておく。
// content で渡すのは、この初期化スクリプト自体がトランスパイルされないようにするため
await page.addInitScript({ content: 'globalThis.__name = globalThis.__name || ((fn) => fn);' });

const snapshot: Snapshot = { props: [], values: [], stories: {} };

/** 値の文字列テーブル。同じ値が数万回現れるので添字に置き換える */
const valueIds = new Map<string, number>();
const idOf = (value: string) => {
  const known = valueIds.get(value);

  if (known !== undefined) {
    return known;
  }

  const id = snapshot.values.length;

  snapshot.values.push(value);
  valueIds.set(value, id);

  return id;
};

let done = 0;

for (const id of storyIds) {
  snapshot.stories[id] = {};

  for (const theme of THEMES) {
    await page.goto(
      `http://localhost:${port}/iframe.html?id=${id}&globals=theme:${theme}&viewMode=story`,
      {
        waitUntil: 'load',
      }
    );

    // 描画完了を待つ。フォントの解決前に測るとレイアウト由来の値がぶれる
    await page.waitForFunction(() => {
      const root = document.querySelector('#storybook-root');

      return root !== null && root.children.length > 0;
    });
    await page.evaluate(() => document.fonts.ready.then(() => undefined));

    const { props, elements } = await page.evaluate(collect);

    if (snapshot.props.length === 0) {
      snapshot.props = props;
    }

    const stored: Record<string, ElementSnapshot> = {};

    for (const [path, element] of Object.entries(elements)) {
      stored[path] = {
        v: element.v.map(idOf),
        ...(element.a === undefined ? {} : { a: element.a }),
      };
    }

    snapshot.stories[id][theme] = stored;
  }

  done++;

  if (done % 10 === 0 || done === storyIds.length) {
    console.log(`  ${done}/${storyIds.length}`);
  }
}

await browser.close();
await close();

writeFileSync(out, JSON.stringify(snapshot));

const elementCount = Object.values(snapshot.stories)
  .flatMap((themes) => Object.values(themes))
  .reduce((total, elements) => total + Object.keys(elements ?? {}).length, 0);

console.log(
  `\n${out} に書き出しました（プロパティ ${snapshot.props.length} 種 / 要素 ${elementCount} 件 / 異なる値 ${snapshot.values.length} 種）`
);
