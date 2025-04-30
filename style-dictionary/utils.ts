import StyleDictionary from 'style-dictionary';
import type { Config, Token } from 'style-dictionary';

type ColorTokenJsonFileNameType = 'light' | 'dark';

// ColorTokenJsonFileNameTypeを使って、style-dictionaryの設定を生成する関数
export const cssFileDefaultCofig = (colorTokenJsonFileName: ColorTokenJsonFileNameType): Config => {
  // Style Dictionary設定
  const config: Config = {
    source: [
      `style-dictionary/tokens/${colorTokenJsonFileName}.json`,
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
            destination: `variables-${colorTokenJsonFileName}-only.css`,
            format: 'css/variables',
          },
        ],
      },
    },
  };

  return config;
};

// pxをremに変換する関数
export const convertFontSizeToRem = (px: number): string => {
  const baseFontSize = 16;
  return `${px / baseFontSize}rem`;
};

export const transformFontSizeToRem = (token: Token) => {
  if (token.name?.includes('font-size')) {
    return convertFontSizeToRem(token.value);
  }

  return token.value;
};

export const transformSizePx = (token: Token) => {
  const isBorderRadius = token.name?.includes('border-radius') && token.value !== 0;
  const isSpacing = token.name?.includes('spacing') && token.value !== 0 && token.value !== '0%';
  const isElevationY =
    token.name?.includes('elevation') && token.name?.includes('-y') && token.value !== 0;
  const isElevationX =
    token.name?.includes('elevation') && token.name?.includes('-x') && token.value !== 0;

  if (isBorderRadius || isSpacing || isElevationY || isElevationX) {
    return `${token.value}px`;
  }

  return token.value;
};

/**
 * @description
 * style-dictionaryを使って、トークンをビルドする関数
 * @param colorTokenJsonFileName - トークンのJSONファイル名
 * @returns void
 * @example
 * buildTokens('light');
 * @example
 * buildTokens('dark');
 */
export const buildTokens = async (
  colorTokenJsonFileName: ColorTokenJsonFileNameType
): Promise<void> => {
  const styleDictionary = new StyleDictionary(cssFileDefaultCofig(colorTokenJsonFileName));
  await styleDictionary.hasInitialized;

  // font-size を rem に変換するトランスフォーム
  styleDictionary.registerTransform({
    name: 'font-size/rem',
    type: 'value',
    transitive: true,
    transform: transformFontSizeToRem,
  });

  // font-size 以外の size を px に変換するトランスフォーム
  styleDictionary.registerTransform({
    name: 'size/px',
    type: 'value',
    transitive: true,
    transform: transformSizePx,
  });

  await styleDictionary.cleanAllPlatforms();
  await styleDictionary.buildAllPlatforms();
};

/**
 * @description
 * light-dark関数の値を生成する関数
 * @param lightJson - light.json
 * @param darkJson - dark.json
 * @returns light-dark関数の値
 */
export const buildLightDarkFunctionValue = (lightJson: unknown, darkJson: unknown) => {
  const lightJsonObject = JSON.parse(lightJson as string) as Record<string, string>;
  const darkJsonObject = JSON.parse(darkJson as string) as Record<string, string>;
  const lightDarkFunctionValue = {};

  for (const key in lightJsonObject) {
    lightDarkFunctionValue[`--${key}`] =
      `light-dark(${lightJsonObject[key]}, ${darkJsonObject[key]})`;
  }

  return lightDarkFunctionValue;
};
