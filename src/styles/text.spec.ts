import { describe, expect, it } from 'vitest';

import { truncate } from './text';

describe('truncate', () => {
  it('自動最小サイズの解除と省略表示の宣言のみを持つ', () => {
    expect(truncate).toEqual({
      minWidth: 0,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    });
  });
});
