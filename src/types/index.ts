/**
 * サイズ
 */
export const sizeTypes = ['sm', 'md', 'lg'] as const;
export type SizeType = (typeof sizeTypes)[number];

/**
 * フォーム部品とボタンのサイズ。`sm` / `md` の 2 段階。
 *
 * `lg` は意図的に持たない。Button / IconButton に `lg` が無いため、
 * フォームの隣にボタンを並べたときに対応する段が無くなる。
 *
 * **この型は公開しない。** 利用側には `InputSize` / `ButtonSize` のように
 * コンポーネント固有の名前を付けて公開する（汎用名は利用側の型と衝突するため）。
 * 段を増減するときはここだけを直す
 */
export type ControlSize = Exclude<SizeType, 'lg'>;

/**
 * zukki サイトのバリアント
 */
export const zukkiVariantTypes = ['profile', 'works', 'outputs'] as const;
export type ZukkiVariantType = (typeof zukkiVariantTypes)[number];

/**
 * コンポーネントのタイトルに指定できる見出しレベル。
 *
 * `h1` はページ全体の見出しとして 1 つだけ置くものなので含めない。
 * ライブラリのコンポーネントがページの主題を名乗ることはない
 */
export const headingLevels = [2, 3, 4, 5, 6] as const;
export type HeadingLevel = (typeof headingLevels)[number];
