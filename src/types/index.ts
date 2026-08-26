/**
 * サイズ
 */
export const sizeTypes = ['sm', 'md', 'lg'] as const;
export type SizeType = (typeof sizeTypes)[number];

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
