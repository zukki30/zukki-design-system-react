import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CardContext, type CardContextValue, useCardContext } from './CardContext';

const createWrapper = (value: CardContextValue) => {
  return ({ children }: { children: ReactNode }) => (
    <CardContext value={value}>{children}</CardContext>
  );
};

describe('useCardContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Card の内側では共有された値を返す', () => {
    const { result } = renderHook(() => useCardContext(), {
      wrapper: createWrapper({ state: { size: 'sm' } }),
    });

    expect(result.current.state.size).toBe('sm');
  });

  it('Card の外側では例外を投げる', () => {
    // React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useCardContext())).toThrow(
      'Card のサブコンポーネントは <Card> の内側で使用してください'
    );
  });
});
