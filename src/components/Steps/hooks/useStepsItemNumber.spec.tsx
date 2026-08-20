import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StepsItemNumberContext, useStepsItemNumber } from './useStepsItemNumber';

describe('useStepsItemNumber', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Steps の内側では割り当てられたステップ番号を返す', () => {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <StepsItemNumberContext value={2}>{children}</StepsItemNumberContext>
    );

    const { result } = renderHook(() => useStepsItemNumber('Steps.Item'), { wrapper });

    expect(result.current).toBe(2);
  });

  it('Steps の外側では例外を投げる', () => {
    // React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useStepsItemNumber('Steps.Item'))).toThrow(
      'Steps.Item は Steps の内側でのみ使用できます。'
    );
  });
});
