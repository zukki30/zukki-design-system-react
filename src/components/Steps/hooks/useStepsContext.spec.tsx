import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StepsContext, useStepsContext } from './useStepsContext';
import type { StepsContextValue } from './useStepsContext';

describe('useStepsContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Steps の内側では共有された値を返す', () => {
    const value: StepsContextValue = {
      state: { current: 2, total: 3, orientation: 'vertical' },
      actions: { select: vi.fn() },
    };
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StepsContext value={value}>{children}</StepsContext>
    );

    const { result } = renderHook(() => useStepsContext(), { wrapper });

    expect(result.current).toEqual(value);
  });

  it('Steps の外側では例外を投げる', () => {
    // React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useStepsContext())).toThrow(
      'Steps のサブコンポーネントは <Steps> の内側で使用してください'
    );
  });
});
