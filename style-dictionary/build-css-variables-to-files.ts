import StyleDictionary from 'style-dictionary';
import type { Config } from 'style-dictionary';

const platforms = {
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
        destination: 'variables.css',
        format: 'css/root-color-scheme',
      },
    ],
  },
};

const config: Config = {
  source: ['style-dictionary/tokens/light.json', 'style-dictionary/tokens/dark.json'],
  platforms,
};

export const LightAndDarkBuildTokens = async (): Promise<void> => {
  const styleDictionary = new StyleDictionary(config);
  await styleDictionary.hasInitialized;

  styleDictionary.registerFormat({
    name: 'css/root-color-scheme',
    format: async ({ dictionary, file, options }) => {
      const { hooks } = options;
      const result = await hooks?.formats?.['css/variables']({
        dictionary,
        file,
        options,
        platform: platforms.css,
      });

      return `:root {\n color-scheme: light dark;\n}\n\n${result}\n`;
    },
  });

  await styleDictionary.cleanAllPlatforms();
  await styleDictionary.buildAllPlatforms();
};

LightAndDarkBuildTokens().catch(console.error);
