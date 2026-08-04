import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { useBodyScrollLock } from './useBodyScrollLock';

/** jsdom はレイアウトを計算しないため、スクロールバー幅を任意の値に差し替える */
const setScrollbarWidth = (width: number) => {
  Object.defineProperty(document.documentElement, 'clientWidth', {
    value: window.innerWidth - width,
    configurable: true,
  });
};

afterEach(() => {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
  setScrollbarWidth(0);
});

describe('useBodyScrollLock', () => {
  it('locked=true のとき body のスクロールを止める', () => {
    renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('locked=false のとき body のスクロールを止めない', () => {
    renderHook(() => useBodyScrollLock(false));

    expect(document.body.style.overflow).toBe('');
  });

  it('アンマウント時にロック前のスタイルへ復帰する', () => {
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '8px';

    const { unmount } = renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.overflow).toBe('hidden');

    unmount();

    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.paddingRight).toBe('8px');
  });

  it('locked が false に変わったときロックを解除する', () => {
    const { rerender } = renderHook(({ locked }) => useBodyScrollLock(locked), {
      initialProps: { locked: true },
    });
    expect(document.body.style.overflow).toBe('hidden');

    rerender({ locked: false });

    expect(document.body.style.overflow).toBe('');
  });

  it('スクロールバー幅がある場合は padding で補う', () => {
    setScrollbarWidth(15);
    document.body.style.paddingRight = '10px';

    const { unmount } = renderHook(() => useBodyScrollLock(true));
    expect(document.body.style.paddingRight).toBe('25px');

    unmount();

    expect(document.body.style.paddingRight).toBe('10px');
  });

  it('スクロールバー幅が 0 の場合は padding を変更しない', () => {
    setScrollbarWidth(0);
    document.body.style.paddingRight = '10px';

    renderHook(() => useBodyScrollLock(true));

    expect(document.body.style.paddingRight).toBe('10px');
  });

  it('複数の要素がロックしている間は解除しない', () => {
    document.body.style.overflow = 'auto';

    const first = renderHook(() => useBodyScrollLock(true));
    const second = renderHook(() => useBodyScrollLock(true));

    first.unmount();
    expect(document.body.style.overflow).toBe('hidden');

    second.unmount();
    expect(document.body.style.overflow).toBe('auto');
  });
});
