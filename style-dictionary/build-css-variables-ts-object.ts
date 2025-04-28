import StyleDictionary from 'style-dictionary';
import type { Config, Token } from 'style-dictionary';

const sources = [
  'style-dictionary/tokens/light.json',
  'style-dictionary/tokens/token.json',
  'style-dictionary/tokens/typography.json',
  'style-dictionary/tokens/dark.json',
];

// pxをremに変換する関数
const convertFontSizeToRem = (px: number): string => {
  const baseFontSize = 16;
  return `${px / baseFontSize}rem`;
};

const configs = sources.map((source) => {
  // source から style-dictionary/tokens/ と .json を削除
  const sourceWithoutTokens = source.replace('style-dictionary/tokens/', '').replace('.json', '');

  const config: Config = {
    source: [source],
    platforms: {
      ts: {
        transformGroup: 'js',
        buildPath: 'src/design-tokens/',
        transforms: ['attribute/cti', 'name/kebab', 'font-size/rem', 'color/css'],
        options: {
          showFileHeader: false,
          outputReferences: false,
        },
        files: [{ destination: `${sourceWithoutTokens}.ts`, format: 'typescript/constants' }],
      },
    },
  };

  return config;
});

const buildAllConfigs = async (): Promise<void> => {
  for (const config of configs) {
    const sd = new StyleDictionary(config);
    await sd.hasInitialized;

    // json を TypeScript の型定義とオブジェクトに変換するフォーマット
    sd.registerFormat({
      name: 'typescript/constants',
      format: async ({ dictionary, file }) => {
        // file.destination から .ts を削除
        const fileName = file.destination?.replace('.ts', '');

        const simplifyTokens = (obj: Record<string, unknown>): Record<string, unknown> => {
          const result: Record<string, unknown> = {};

          for (const [key, value] of Object.entries(obj)) {
            if (value && typeof value === 'object' && 'value' in value) {
              result[key] = value.value;
            } else if (typeof value === 'object') {
              result[key] = value ? simplifyTokens(value as Record<string, unknown>) : value;
            }
          }

          return result;
        };

        const tokens = simplifyTokens(dictionary.tokens);

        return `// このファイルは自動生成されています。直接編集しないでください。

export const ${fileName}DesignTokens = ${JSON.stringify(tokens, null, 2)} as const;
`;
      },
    });

    // font-size を rem に変換するトランスフォーム
    sd.registerTransform({
      name: 'font-size/rem',
      type: 'value',
      transitive: true,
      transform: (token: Token): string => {
        if (token.name?.includes('font-size')) {
          return convertFontSizeToRem(token.value);
        }

        return token.value;
      },
    });

    await sd.cleanAllPlatforms();
    await sd.buildAllPlatforms();
  }
};

// トップレベルでの非同期実行
buildAllConfigs().catch(console.error);
