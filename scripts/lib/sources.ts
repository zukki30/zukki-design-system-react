/**
 * ビルドスクリプトと検査スクリプトが共有する、ソースの読み取り。
 *
 * 同じものを 2 箇所で別々の正規表現から読むと、片方だけが壊れたときに気づけない。
 * とくに検査側が黙って空配列を返すと、網羅性の検査が空振りしたまま ✅ になってしまう。
 * 読み取りはここへ集約し、読めなければ必ず例外を投げる。
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const ROOT = join(import.meta.dirname, '..', '..');

const COMPONENTS_DIR = join(ROOT, 'src', 'components');

/**
 * 公開しているコンポーネント名。
 *
 * `src/components/` 直下のディレクトリは、1 つがそのままコンポーネント 1 件である前提。
 * ここへ非コンポーネントのディレクトリを置くと、Props 型の検査が存在しない
 * `XxxProps` を要求して落ちる
 */
export const readComponentNames = (): string[] =>
  readdirSync(COMPONENTS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

/** `Icon` の `name` に渡せる値。`src/components/Icon/types.ts` をそのまま読む */
export const readIconNames = (): string[] => {
  const source = readFileSync(join(COMPONENTS_DIR, 'Icon', 'types.ts'), 'utf8');
  const block = /export const iconNames = \[([\s\S]*?)\] as const;/.exec(source);

  if (block === null) {
    throw new Error('src/components/Icon/types.ts から iconNames を読めません');
  }

  const names = [...block[1].matchAll(/'([^']+)'/g)].map((matched) => matched[1]);

  if (names.length === 0) {
    throw new Error('src/components/Icon/types.ts の iconNames が空です');
  }

  return names;
};

/**
 * compound components と、そのパーツ。
 *
 * `Card.Header = CardHeader;` のような代入から読む。一覧を手で持つと
 * コンポーネントを足したときに片方だけ古くなるため、ソースを唯一の正とする。
 *
 * パーツは並び順に意味がある（`Card` なら描画順）ので、ソートせず出現順を保つ。
 */
export const readCompoundParts = (): Map<string, string[]> => {
  const compounds = new Map<string, string[]>();

  for (const name of readComponentNames()) {
    const implementation = join(COMPONENTS_DIR, name, `${name}.tsx`);

    // 規約どおりなら必ずある。無い場合、パーツを読めずに「合成ではない」と
    // 誤って判定してしまうため、黙って飛ばさず止める
    if (!existsSync(implementation)) {
      throw new Error(`${name} の実装ファイル（${name}.tsx）が見つかりません`);
    }

    const parts = [
      ...readFileSync(implementation, 'utf8').matchAll(
        new RegExp(`^${name}\\.([A-Z][A-Za-z0-9]*) = `, 'gm')
      ),
    ].map((matched) => matched[1]);

    if (parts.length > 0) {
      compounds.set(name, parts);
    }
  }

  return compounds;
};
