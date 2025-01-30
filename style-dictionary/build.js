const StyleDictionary = require('style-dictionary');

// pxをremに変換する関数
const pxToRem = (px) => {
  const baseFontSize = 16;
  return `${px / baseFontSize}rem`;
};

// Style Dictionary設定
const styleDictionary = StyleDictionary.extend({
  source: [
    "style-dictionary/tokens/light.json",
    "style-dictionary/tokens/token.json",
    "style-dictionary/tokens/typography.json",
  ],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "src/styles/",
      transforms: [
        "attribute/cti",
        "name/cti/kebab",
        "size/px",
        "size/rem",
        "color/css"
      ],
      options: {
        showFileHeader: false,
        outputReferences: false
      },
      files: [
        {
          destination: "variables.css",
          format: "css/variables",
        }
      ],
    }
  },
});

// カスタムトランスフォームの定義
styleDictionary.registerTransform({
  name: 'size/px',
  type: 'value',
  matcher: (token) => {
    return (
      token.name.includes('border-radius') ||
      token.name.includes('spacing')
    );
  },
  transformer: (token) => {
    return `${token.value}px`;
  },
});

styleDictionary.registerTransform({
  name: 'size/rem',
  type: 'value',
  matcher: (token) => {
    return token.name.includes('font-size');
  },
  transformer: (token) => {
    return pxToRem(token.value);
  },
});

styleDictionary.cleanAllPlatforms();

styleDictionary.buildAllPlatforms();