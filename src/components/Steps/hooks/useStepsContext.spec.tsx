import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StepsContext, useStepsContext } from './useStepsContext';

describe('useStepsContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Steps の内側では共有された値を返す', () => {
    const value = { current: 2, orientation: 'vertical', total: 3 } as const;
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StepsContext value={value}>{children}</StepsContext>
    );

    const { result } = renderHook(() => useStepsContext('Steps.Item'), { wrapper });

    expect(result.current).toEqual(value);
  });

  it('Steps の外側では例外を投げる', () => {
    // React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useStepsContext('Steps.Item'))).toThrow(
      'Steps.Item は Steps の内側でのみ使用できます。'
    );
  });
});
