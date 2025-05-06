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
