import StyleDictionary from 'style-dictionary';
import type { Config } from 'style-dictionary';

// Style Dictionary設定
const config: Config = {
  source: ['style-dictionary/tokens/dark.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      transforms: ['attribute/cti', 'name/kebab', 'color/css'],
      options: {
        showFileHeader: false,
        outputReferences: false,
        selector: ":root[data-theme='dark']",
      },
      files: [
        {
          destination: 'variables-dark.css',
          format: 'css/variables',
        },
      ],
    },
  },
};

const buildTokens = async (): Promise<void> => {
  const styleDictionary = new StyleDictionary(config);
  await styleDictionary.hasInitialized;

  await styleDictionary.cleanAllPlatforms();
  await styleDictionary.buildAllPlatforms();
};

buildTokens().catch(console.error);
