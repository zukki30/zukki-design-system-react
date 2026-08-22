import { describe, expect, it } from 'vitest';

import { toTruthyOrUndefined } from './dataAttribute';

describe('toTruthyOrUndefined', () => {
  it('true はそのまま返す', () => {
    expect(toTruthyOrUndefined(true)).toBe(true);
  });

  it('false は undefined に潰す', () => {
    expect(toTruthyOrUndefined(false)).toBeUndefined();
  });

  it('undefined はそのまま undefined を返す', () => {
    expect(toTruthyOrUndefined(undefined)).toBeUndefined();
  });
});
