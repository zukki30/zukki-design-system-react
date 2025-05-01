import StyleDictionary from 'style-dictionary';
import type { TransformedTokens } from 'style-dictionary';

import {
  buildSimplifyTokens,
  combineLightDarkTokens,
  transformFontSizeToRem,
  transformSizePx,
} from './utils';

const FORMAT_NAME = 'typescript/constants';

const colorConfig = (fileName: 'light' | 'dark') => ({
  source: [`style-dictionary/tokens/${fileName}.json`],
  platforms: {
    ts: {
      transformGroup: 'js',
      buildPath: 'src/design-tokens/',
      transforms: ['attribute/cti', 'name/kebab', 'color/css'],
      options: {
        showFileHeader: false,
        outputReferences: false,
      },
      files: [{ destination: `${fileName}.ts`, format: FORMAT_NAME }],
    },
  },
});

const lightDarkConfig = () => ({
  source: ['style-dictionary/tokens/light.json'],
  platforms: {
    ts: {
      transformGroup: 'js',
      buildPath: 'src/design-tokens/',
      transforms: ['attribute/cti', 'name/kebab', 'color/css'],
      options: {
        showFileHeader: false,
        outputReferences: false,
      },
      files: [{ destination: 'light-dark.ts', format: FORMAT_NAME }],
    },
  },
});

const DEFAULT_FILES = ['token', 'typography'] as const;
type DefaultFile = (typeof DEFAULT_FILES)[number];

const defaultConfig = (fileName: DefaultFile) => ({
  source: [`style-dictionary/tokens/${fileName}.json`],
  platforms: {
    ts: {
      transformGroup: 'js',
      buildPath: 'src/design-tokens/',
      transforms: ['attribute/cti', 'name/kebab', 'font-size/rem', 'size/px', 'number/string'],
      options: {
        showFileHeader: false,
        outputReferences: false,
      },
      files: [{ destination: `${fileName}.ts`, format: FORMAT_NAME }],
    },
  },
});

const buildAllConfigs = async (): Promise<void> => {
  let lightJson: TransformedTokens;
  let darkJson: TransformedTokens;

  // light.ts を生成し、 lightJson に格納
  const lightStyleDictionary = new StyleDictionary(colorConfig('light'));
  await lightStyleDictionary.hasInitialized;

  lightStyleDictionary.registerFormat({
    name: FORMAT_NAME,
    format: async ({ dictionary, file }) => {
      lightJson = dictionary.tokens;

      // file.destination から .ts を削除
      const fileName = file.destination?.replace('.ts', '');
      const tokens = buildSimplifyTokens(dictionary.tokens);

      return `// このファイルは自動生成されています。直接編集しないでください。

export const ${fileName}DesignTokens = ${JSON.stringify(tokens, null, 2)} as const;
`;
    },
  });

  await lightStyleDictionary.cleanAllPlatforms();
  await lightStyleDictionary.buildAllPlatforms();

  // dark.ts を生成し、 darkJson に格納
  const darkStyleDictionary = new StyleDictionary(colorConfig('dark'));
  await darkStyleDictionary.hasInitialized;

  darkStyleDictionary.registerFormat({
    name: FORMAT_NAME,
    format: async ({ dictionary, file }) => {
      darkJson = dictionary.tokens;

      // file.destination から .ts を削除
      const fileName = file.destination?.replace('.ts', '');
      const tokens = buildSimplifyTokens(dictionary.tokens);

      return `// このファイルは自動生成されています。直接編集しないでください。

export const ${fileName}DesignTokens = ${JSON.stringify(tokens, null, 2)} as const;
`;
    },
  });

  await darkStyleDictionary.cleanAllPlatforms();
  await darkStyleDictionary.buildAllPlatforms();

  // light-dark.ts を生成
  const lightDarkStyleDictionary = new StyleDictionary(lightDarkConfig());
  await lightDarkStyleDictionary.hasInitialized;

  lightDarkStyleDictionary.registerFormat({
    name: FORMAT_NAME,
    format: async () => {
      const result = combineLightDarkTokens(lightJson, darkJson);

      return `// このファイルは自動生成されています。直接編集しないでください。

export const lightDarkDesignTokens = ${JSON.stringify(result, null, 2)} as const;
`;
    },
  });

  await lightDarkStyleDictionary.cleanAllPlatforms();
  await lightDarkStyleDictionary.buildAllPlatforms();

  // トークンを TypeScript の型定義とオブジェクトに変換
  for (const file of DEFAULT_FILES) {
    const sd = new StyleDictionary(defaultConfig(file));
    await sd.hasInitialized;

    // json を TypeScript の型定義とオブジェクトに変換するフォーマット
    sd.registerFormat({
      name: FORMAT_NAME,
      format: async ({ dictionary, file }) => {
        // file.destination から .ts を削除
        const fileName = file.destination?.replace('.ts', '');
        const tokens = buildSimplifyTokens(dictionary.tokens);

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
      transform: transformFontSizeToRem,
    });

    // font-size 以外の size を px に変換するトランスフォーム
    sd.registerTransform({
      name: 'size/px',
      type: 'value',
      transitive: true,
      transform: transformSizePx,
    });

    // number を string に変換するトランスフォーム
    sd.registerTransform({
      name: 'number/string',
      type: 'value',
      transitive: true,
      transform: (token) => {
        if (typeof token.value === 'number') {
          return token.value.toString();
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
