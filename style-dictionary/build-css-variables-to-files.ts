import StyleDictionary from 'style-dictionary';
import type { Config } from 'style-dictionary';
import { propertyFormatNames } from 'style-dictionary/enums';
import { formattedVariables } from 'style-dictionary/utils';

import { buildLightDarkFunctionValue, transformFontSizeToRem, transformSizePx } from './utils';

const OUTPUT_CSS_FILE_NAME = 'variables.css';

const colorTokenConfig = (fileName: 'light' | 'dark') => ({
  source: [`style-dictionary/tokens/${fileName}.json`],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      transforms: ['attribute/cti', 'name/kebab', 'color/css'],
      options: {
        showFileHeader: false,
        outputReferences: false,
      },
      files: [
        {
          destination: OUTPUT_CSS_FILE_NAME,
          format: 'css/json',
        },
      ],
    },
  },
});

// Token.json と Typography.json を読み込んで CSS 変数を生成する
const defaultTokenConfig: Config = {
  source: ['style-dictionary/tokens/token.json', 'style-dictionary/tokens/typography.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      transforms: ['attribute/cti', 'name/kebab', 'font-size/rem', 'size/px'],
      options: {
        showFileHeader: false,
        outputReferences: true,
      },
      files: [
        {
          destination: OUTPUT_CSS_FILE_NAME,
          format: 'css/format',
        },
      ],
    },
  },
};

export const BuildTokens = async (): Promise<void> => {
  let lightJson: unknown;
  let darkJson: unknown;

  // light.json を読み込んで CSS 変数を生成する
  const lightStyleDictionary = new StyleDictionary(colorTokenConfig('light'));
  await lightStyleDictionary.hasInitialized;

  lightStyleDictionary.registerFormat({
    name: 'css/json',
    format: async ({ dictionary, file, options }) => {
      const { hooks } = options;
      lightJson = await hooks?.formats?.['json/flat']({
        dictionary,
        file,
        options: {},
        platform: {},
      });

      return null;
    },
  });

  await lightStyleDictionary.cleanAllPlatforms();
  await lightStyleDictionary.buildAllPlatforms();

  // dark.json を読み込んで CSS 変数を生成する
  const darkStyleDictionary = new StyleDictionary(colorTokenConfig('dark'));
  await darkStyleDictionary.hasInitialized;

  darkStyleDictionary.registerFormat({
    name: 'css/json',
    format: async ({ dictionary, file, options }) => {
      const { hooks } = options;
      darkJson = await hooks?.formats?.['json/flat']({
        dictionary,
        file,
        options: {},
        platform: {},
      });

      return null;
    },
  });

  await darkStyleDictionary.cleanAllPlatforms();
  await darkStyleDictionary.buildAllPlatforms();

  const lightDarkFunctionValue = buildLightDarkFunctionValue(lightJson, darkJson);

  // Token.json と Typography.json を読み込んで CSS 変数を生成する
  const defaultStyleDictionary = new StyleDictionary(defaultTokenConfig);
  await defaultStyleDictionary.hasInitialized;

  defaultStyleDictionary.registerFormat({
    name: 'css/format',
    format: async ({ dictionary, file }) => {
      return `:root {\n  color-scheme: light dark;\n}\n\n:root {
${Object.entries(lightDarkFunctionValue)
  .map(([key, value]) => `  ${key}: ${value};`)
  .join('\n')}
${formattedVariables({
  format: propertyFormatNames.css,
  dictionary,
  outputReferences: file.options?.outputReferences,
})}
}
`;
    },
  });

  // font-size を rem に変換するトランスフォーム
  defaultStyleDictionary.registerTransform({
    name: 'font-size/rem',
    type: 'value',
    transitive: true,
    transform: transformFontSizeToRem,
  });

  // font-size 以外の size を px に変換するトランスフォーム
  defaultStyleDictionary.registerTransform({
    name: 'size/px',
    type: 'value',
    transitive: true,
    transform: transformSizePx,
  });

  await defaultStyleDictionary.cleanAllPlatforms();
  await defaultStyleDictionary.buildAllPlatforms();
};

BuildTokens().catch(console.error);
