import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CardContext, useCardContext } from './useCardContext';

describe('useCardContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Card の内側では共有された値を返す', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <CardContext value={{ size: 'sm' }}>{children}</CardContext>
    );

    const { result } = renderHook(() => useCardContext('Card.Body'), { wrapper });

    expect(result.current).toEqual({ size: 'sm' });
  });

  it('Card の外側では例外を投げる', () => {
    // React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useCardContext('Card.Body'))).toThrow(
      'Card.Body は Card の内側でのみ使用できます。'
    );
  });
});
