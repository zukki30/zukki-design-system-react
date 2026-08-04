import { describe, expect, it } from 'vitest';

import { interactiveTouch } from './interactive';

describe('interactiveTouch', () => {
  it('ダブルタップズーム抑制とタップハイライト無効化の宣言のみを持つ', () => {
    expect(interactiveTouch).toEqual({
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
    });
  });
});
