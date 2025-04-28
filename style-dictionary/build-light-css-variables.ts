import StyleDictionary from 'style-dictionary';
import type { Config, Token } from 'style-dictionary';

// pxをremに変換する関数
const convertFontSizeToRem = (px: number): string => {
  const baseFontSize = 16;
  return `${px / baseFontSize}rem`;
};

// Style Dictionary設定
const config: Config = {
  source: [
    'style-dictionary/tokens/light.json',
    'style-dictionary/tokens/token.json',
    'style-dictionary/tokens/typography.json',
  ],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      transforms: ['attribute/cti', 'name/kebab', 'font-size/rem', 'size/px', 'color/css'],
      options: {
        showFileHeader: false,
        outputReferences: false,
      },
      files: [
        {
          destination: 'variables.css',
          format: 'css/variables',
        },
      ],
    },
  },
};

const buildTokens = async (): Promise<void> => {
  const styleDictionary = new StyleDictionary(config);
  await styleDictionary.hasInitialized;

  // font-size を rem に変換するトランスフォーム
  styleDictionary.registerTransform({
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

  // font-size 以外の size を px に変換するトランスフォーム
  styleDictionary.registerTransform({
    name: 'size/px',
    type: 'value',
    transitive: true,
    transform: (token: Token): string => {
      const isBorderRadius = token.name?.includes('border-radius') && token.value !== 0;
      const isSpacing = token.name?.includes('spacing') && token.value !== 0;
      const isElevationY =
        token.name?.includes('elevation') && token.name?.includes('-y') && token.value !== 0;
      const isElevationX =
        token.name?.includes('elevation') && token.name?.includes('-x') && token.value !== 0;

      if (isBorderRadius || isSpacing || isElevationY || isElevationX) {
        return `${token.value}px`;
      }

      return token.value;
    },
  });

  await styleDictionary.cleanAllPlatforms();
  await styleDictionary.buildAllPlatforms();
};

buildTokens().catch(console.error);
