import { fireEvent, render, renderHook, screen } from '@testing-library/react';
import { useEffect, useId } from 'react';
import type { ReactNode } from 'react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Dialog } from './Dialog';
import { DialogContext, type DialogContextValue, useDialogContext } from './DialogContext';

// jsdom は showModal/close を未実装のためモックする
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.setAttribute('open', '');
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.removeAttribute('open');
    this.dispatchEvent(new Event('close'));
  });
});

const createContextValue = (
  overrides?: Partial<DialogContextValue['state']>
): DialogContextValue => ({
  state: { open: true, ...overrides },
  actions: { close: vi.fn() },
  meta: { registerTitle: vi.fn(() => () => {}) },
});

const createWrapper = (value: DialogContextValue) => {
  return ({ children }: { children: ReactNode }) => (
    <DialogContext value={value}>{children}</DialogContext>
  );
};

describe('useDialogContext', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('Dialog の内側では共有された値を返す', () => {
    const value = createContextValue();
    const { result } = renderHook(() => useDialogContext(), { wrapper: createWrapper(value) });

    expect(result.current.state.open).toBe(true);
    expect(result.current.actions.close).toBe(value.actions.close);
    expect(result.current.meta.registerTitle).toBe(value.meta.registerTitle);
  });

  it('閉じているときは state.open が false になる', () => {
    const { result } = renderHook(() => useDialogContext(), {
      wrapper: createWrapper(createContextValue({ open: false })),
    });

    expect(result.current.state.open).toBe(false);
  });

  it('Dialog の外側では例外を投げる', () => {
    // React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
    vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => renderHook(() => useDialogContext())).toThrow(
      'Dialog のサブコンポーネントは <Dialog> の内側で使用してください'
    );
  });

  describe('利用側の独自パーツから使う', () => {
    const CustomCloseButton = () => {
      const {
        state: { open },
        actions: { close },
      } = useDialogContext();

      return (
        <button type="button" onClick={close}>
          {open ? '開いている' : '閉じている'}
        </button>
      );
    };

    it('実際の Dialog から開閉状態と閉じる操作を参照できる', () => {
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose}>
          <Dialog.Footer>
            <CustomCloseButton />
          </Dialog.Footer>
        </Dialog>
      );

      fireEvent.click(screen.getByRole('button', { name: '開いている' }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    // Dialog.Title を使わず独自の見出しを組む場合でも、meta.registerTitle だけで
    // ルートの aria-labelledby に紐付けられることを確認する
    const CustomTitle = ({ children }: { children: ReactNode }) => {
      const {
        meta: { registerTitle },
      } = useDialogContext();
      const titleId = useId();

      useEffect(() => registerTitle(titleId), [registerTitle, titleId]);

      return <h3 id={titleId}>{children}</h3>;
    };

    it('meta.registerTitle で登録した id が aria-labelledby に反映される', () => {
      render(
        <Dialog open>
          <Dialog.Header>
            <CustomTitle>独自タイトル</CustomTitle>
          </Dialog.Header>
        </Dialog>
      );

      const heading = screen.getByRole('heading', { level: 3, name: '独自タイトル' });

      expect(document.querySelector('dialog')).toHaveAttribute('aria-labelledby', heading.id);
    });

    it('独自パーツがアンマウントされると aria-labelledby が外れる', () => {
      const { rerender } = render(
        <Dialog open>
          <Dialog.Header>
            <CustomTitle>独自タイトル</CustomTitle>
          </Dialog.Header>
        </Dialog>
      );

      rerender(
        <Dialog open>
          <Dialog.Header />
        </Dialog>
      );

      expect(document.querySelector('dialog')).not.toHaveAttribute('aria-labelledby');
    });
  });
});
