import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  StepsContext,
  StepsItemNumberContext,
  useStepsContext,
  useStepsItemNumber,
} from './StepsContext';
import type { StepsContextValue } from './StepsContext';

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

describe('useStepsItemNumber', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Steps の内側では割り当てられたステップ番号を返す', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StepsItemNumberContext value={2}>{children}</StepsItemNumberContext>
    );

    const { result } = renderHook(() => useStepsItemNumber(), { wrapper });

    expect(result.current).toBe(2);
  });

  it('Steps の外側では例外を投げる', () => {
    // React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useStepsItemNumber())).toThrow(
      'Steps のサブコンポーネントは <Steps> の内側で使用してください'
    );
  });
});
