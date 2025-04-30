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

/**
 * @description
 * トークンを簡略化する関数
 * @param obj - トークン
 * @returns 簡略化されたトークン
 */
export const buildSimplifyTokens = (obj: Record<string, unknown>): Record<string, unknown> => {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === 'object' && 'value' in value) {
      result[key] = value.value;
    } else if (typeof value === 'object') {
      result[key] = value ? buildSimplifyTokens(value as Record<string, unknown>) : value;
    }
  }

  return result;
};

/**
 * @description
 * lightとdarkのデザイントークンを結合し、light-dark関数の形式に変換する
 * @param lightTokens - lightのデザイントークン
 * @param darkTokens - darkのデザイントークン
 * @returns light-dark関数の形式に変換されたトークン
 * @example
 * const result = combineLightDarkTokens(lightTokens, darkTokens);
 * // {
 * //   "color": {
 * //     "focus": "light-dark(#ffffff, #000000)"
 * //   }
 * // }
 */
export const combineLightDarkTokens = (
  lightTokens: Record<string, unknown>,
  darkTokens: Record<string, unknown>
): Record<string, unknown> => {
  const processTokens = (
    light: Record<string, unknown>,
    dark: Record<string, unknown>,
    currentPath: string[] = []
  ): Record<string, unknown> => {
    const processed: Record<string, unknown> = {};

    for (const [key, lightValue] of Object.entries(light)) {
      const darkValue = dark[key];
      const newPath = [...currentPath, key];

      if (
        lightValue &&
        darkValue &&
        typeof lightValue === 'object' &&
        typeof darkValue === 'object' &&
        !(('value' in lightValue) as unknown as object) &&
        !(('value' in darkValue) as unknown as object)
      ) {
        processed[key] = processTokens(
          lightValue as Record<string, unknown>,
          darkValue as Record<string, unknown>,
          newPath
        );
      } else if (
        lightValue &&
        darkValue &&
        typeof lightValue === 'object' &&
        typeof darkValue === 'object' &&
        'value' in (lightValue as object) &&
        'value' in (darkValue as object)
      ) {
        processed[key] = `light-dark(${(lightValue as { value: string }).value}, ${
          (darkValue as { value: string }).value
        })`;
      }
    }

    return processed;
  };

  return processTokens(lightTokens, darkTokens);
};
