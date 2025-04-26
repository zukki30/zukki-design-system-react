import StyleDictionary from 'style-dictionary';

// pxをremに変換する関数
const pxToRem = (px) => {
  const baseFontSize = 16;
  return `${px / baseFontSize}rem`;
};

// カスタムトランスフォームの定義
StyleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: (token) => {
    return token.name.includes('border-radius') || token.name.includes('spacing');
  },
  transform: (token) => {
    return `${token.value}px`;
  },
});

StyleDictionary.registerTransform({
  name: 'size/rem',
  type: 'value',
  matcher: (token) => {
    return token.name.includes('font-size');
  },
  transform: (token) => {
    return pxToRem(token.value);
  },
});

// Style Dictionary設定
const config = {
  source: [
    'style-dictionary/tokens/light.json',
    'style-dictionary/tokens/token.json',
    'style-dictionary/tokens/typography.json',
  ],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'src/styles/',
      transforms: ['attribute/cti', 'name/kebab', 'size/px', 'size/rem', 'color/css'],
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

const buildTokens = async () => {
  const styleDictionary = new StyleDictionary(config);
  await styleDictionary.hasInitialized;
  await styleDictionary.cleanAllPlatforms();
  await styleDictionary.buildAllPlatforms();
};

buildTokens().catch(console.error);
