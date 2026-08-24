import { describe, expect, it } from 'vitest';

import { inputColorSchemeLight } from './colorScheme';

describe('inputColorSchemeLight', () => {
  it('color-scheme をライトに固定する宣言のみを持つ', () => {
    expect(inputColorSchemeLight).toEqual({
      colorScheme: 'light',
    });
  });
});
