import { describe, expect, it } from 'vitest';

import { interactiveTouch } from './interactive';

describe('interactiveTouch', () => {
  it('ダブルタップズームを無効化する touch-action を持つ', () => {
    expect(interactiveTouch.touchAction).toBe('manipulation');
  });

  it('既定のタップハイライトを透明にする', () => {
    expect(interactiveTouch.WebkitTapHighlightColor).toBe('transparent');
  });

  it('タッチ操作に関する宣言のみを持つ', () => {
    expect(interactiveTouch).toEqual({
      touchAction: 'manipulation',
      WebkitTapHighlightColor: 'transparent',
    });
  });
});
