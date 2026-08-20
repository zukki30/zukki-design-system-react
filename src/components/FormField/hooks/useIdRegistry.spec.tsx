import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useIdRegistry } from './useIdRegistry';

describe('useIdRegistry', () => {
  it('初期状態では何も登録されていない', () => {
    const { result } = renderHook(() => useIdRegistry());

    expect(result.current[0]).toEqual([]);
  });

  it('登録した id を登録順に返す', () => {
    const { result } = renderHook(() => useIdRegistry());

    act(() => {
      result.current[1]('first');
      result.current[1]('second');
    });

    expect(result.current[0]).toEqual(['first', 'second']);
  });

  it('登録解除した id だけを取り除く', () => {
    const { result } = renderHook(() => useIdRegistry());
    let unregisterFirst: () => void = () => {};

    act(() => {
      unregisterFirst = result.current[1]('first');
      result.current[1]('second');
    });

    act(() => {
      unregisterFirst();
    });

    expect(result.current[0]).toEqual(['second']);
  });

  it('register の参照は再レンダーしても変わらない', () => {
    const { result, rerender } = renderHook(() => useIdRegistry());
    const register = result.current[1];

    act(() => {
      result.current[1]('first');
    });
    rerender();

    expect(result.current[1]).toBe(register);
  });
});
