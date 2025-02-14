const StyleDictionary = require('style-dictionary');

const sources = [
  'style-dictionary/tokens/light.json',
  'style-dictionary/tokens/token.json',
  'style-dictionary/tokens/typography.json',
  'style-dictionary/tokens/dark.json',
];

// pxをremに変換する関数
const pxToRem = (px) => {
  const baseFontSize = 16;
  return `${px / baseFontSize}rem`;
};

// json を TypeScript の型定義とオブジェクトに変換するフォーマット
StyleDictionary.registerFormat({
  name: 'typescript/constants',
  formatter: ({ dictionary, file }) => {
    console.log(1111, file.destination);

    // file.destination から .ts を削除
    const fileName = file.destination.replace('.ts', '');

    const simplifyTokens = (obj) => {
      const result = {};

      for (const [key, value] of Object.entries(obj)) {
        if (value.value !== undefined) {
          result[key] = value.value;
        } else if (typeof value === 'object') {
          result[key] = simplifyTokens(value);
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

StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: (token) => {
    return token.name.includes('border-radius') || token.name.includes('spacing');
  },
  transformer: (token) => {
    return `${token.value}px`;
  },
});

StyleDictionary.registerTransform({
  name: 'size/rem',
  type: 'value',
  matcher: (token) => {
    return token.name.includes('font-size');
  },
  transformer: (token) => {
    return pxToRem(token.value);
  },
});

const configs = sources.map((source) => {
  // source から style-dictionary/tokens/ と .json を削除
  const sourceWithoutTokens = source.replace('style-dictionary/tokens/', '').replace('.json', '');

  const config = {
    source: [source],
    platforms: {
      ts: {
        transformGroup: 'js',
        buildPath: 'src/design-tokens/',
        transforms: ['attribute/cti', 'name/cti/kebab', 'size/px', 'size/rem', 'color/css'],
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

configs.forEach((config) => {
  const sd = StyleDictionary.extend(config);
  sd.cleanAllPlatforms();
  sd.buildAllPlatforms();
});
