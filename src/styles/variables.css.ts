import { createGlobalTheme } from '@vanilla-extract/css';

import { lightDarkDesignTokens } from '../design-tokens/light-dark';
import { tokenDesignTokens } from '../design-tokens/token';
import { typographyDesignTokens } from '../design-tokens/typography';

export const vars = createGlobalTheme(':root', {
  ...lightDarkDesignTokens,
  ...tokenDesignTokens,
  ...typographyDesignTokens,
});
