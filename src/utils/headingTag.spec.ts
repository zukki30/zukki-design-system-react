import { describe, expect, it } from 'vitest';

import { headingLevels } from '@/types';

import { headingTag } from './headingTag';

describe('headingTag', () => {
  it.each(headingLevels)('level=%i を見出し要素のタグ名に変換する', (level) => {
    expect(headingTag(level)).toBe(`h${level}`);
  });
});
