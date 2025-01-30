const StyleDictionary = require('style-dictionary');

// Style Dictionary設定
const styleDictionary = StyleDictionary.extend({
  source: [
    "style-dictionary/tokens/dark.json",
  ],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "src/styles/",
      transforms: [
        "attribute/cti",
        "name/cti/kebab",
        "color/css"
      ],
      options: {
        showFileHeader: false,
        outputReferences: false,
        selector: ":root[data-theme='dark']"
      },
      files: [
        {
          destination: "variables-dark.css",
          format: "css/variables",
        }
      ],
    }
  },
});

styleDictionary.cleanAllPlatforms();

styleDictionary.buildAllPlatforms();