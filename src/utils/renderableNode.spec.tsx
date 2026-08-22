import { describe, expect, it } from 'vitest';

import { isRenderable } from './renderableNode';

describe('isRenderable', () => {
  it.each([
    { name: '文字列', node: 'ラベル' },
    { name: '0', node: 0 },
    { name: '空文字', node: '' },
    { name: '要素', node: <span /> },
  ])('React が描画する値（$name）は true を返す', ({ node }) => {
    expect(isRenderable(node)).toBe(true);
  });

  it.each([
    { name: 'undefined', node: undefined },
    { name: 'null', node: null },
    // {cond && label} が偽のときに残る値。null と同じく未指定として扱う
    { name: 'false', node: false },
    { name: 'true', node: true },
  ])('React が何も描画しない値（$name）は false を返す', ({ node }) => {
    expect(isRenderable(node)).toBe(false);
  });
});
