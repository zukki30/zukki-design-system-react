import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  FormFieldContext,
  type FormFieldContextValue,
  useFormFieldContext,
  useFormFieldState,
} from './FormFieldContext';

const noop = () => () => {};

const createContextValue = (
  state?: Partial<FormFieldContextValue['state']>
): FormFieldContextValue => ({
  state: {
    required: false,
    requiredMark: 'badge',
    disabled: false,
    error: false,
    size: 'md',
    ...state,
  },
  actions: {
    registerLabel: noop,
    registerControl: noop,
    registerHelperText: noop,
    registerErrorText: noop,
  },
  meta: { labelId: 'label-id', labelledControlId: undefined, describedBy: undefined },
});

const createWrapper = (state?: Partial<FormFieldContextValue['state']>) => {
  const value = createContextValue(state);

  return ({ children }: { children: ReactNode }) => (
    <FormFieldContext value={value}>{children}</FormFieldContext>
  );
};

describe('useFormFieldContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('FormField の内側では共有された値を返す', () => {
    const { result } = renderHook(() => useFormFieldContext(), {
      wrapper: createWrapper({ required: true }),
    });

    expect(result.current.state.required).toBe(true);
    expect(result.current.meta.labelId).toBe('label-id');
  });

  it('FormField の外側では例外を投げる', () => {
    // React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useFormFieldContext())).toThrow(
      'FormField のサブコンポーネントは <FormField> の内側で使用してください'
    );
  });
});

describe('useFormFieldState', () => {
  it('FormField の外側では渡された値をそのまま返す', () => {
    const { result } = renderHook(() => useFormFieldState({ error: true, disabled: true }));

    expect(result.current).toEqual({ error: true, disabled: true, size: 'md' });
  });

  it('FormField の外側で未指定なら undefined を返す', () => {
    const { result } = renderHook(() => useFormFieldState({}));

    expect(result.current).toEqual({ error: undefined, disabled: undefined, size: 'md' });
  });

  it('未指定のときは FormField の状態を引き継ぐ', () => {
    const { result } = renderHook(() => useFormFieldState({}), {
      wrapper: createWrapper({ error: true, disabled: true }),
    });

    expect(result.current).toEqual({ error: true, disabled: true, size: 'md' });
  });

  it('FormField の状態が false のときは属性を出力しないよう undefined にする', () => {
    const { result } = renderHook(() => useFormFieldState({}), {
      wrapper: createWrapper({ error: false, disabled: false }),
    });

    expect(result.current).toEqual({ error: undefined, disabled: undefined, size: 'md' });
  });

  it('明示された値は FormField の状態より優先する', () => {
    const { result } = renderHook(() => useFormFieldState({ error: false, disabled: false }), {
      wrapper: createWrapper({ error: true, disabled: true }),
    });

    expect(result.current).toEqual({ error: false, disabled: false, size: 'md' });
  });

  describe('size', () => {
    it('FormField の外側で未指定なら md を返す', () => {
      const { result } = renderHook(() => useFormFieldState({}));

      expect(result.current.size).toBe('md');
    });

    it('FormField の外側でも明示された size を返す', () => {
      const { result } = renderHook(() => useFormFieldState({ size: 'sm' }));

      expect(result.current.size).toBe('sm');
    });

    it('未指定のときは FormField の size を引き継ぐ', () => {
      const { result } = renderHook(() => useFormFieldState({}), {
        wrapper: createWrapper({ size: 'sm' }),
      });

      expect(result.current.size).toBe('sm');
    });

    it('明示された size は FormField の size より優先する', () => {
      const { result } = renderHook(() => useFormFieldState({ size: 'md' }), {
        wrapper: createWrapper({ size: 'sm' }),
      });

      expect(result.current.size).toBe('md');
    });
  });
});
