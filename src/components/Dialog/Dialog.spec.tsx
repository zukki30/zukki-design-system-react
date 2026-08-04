import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { Dialog } from './Dialog';

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

afterEach(() => {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
});

describe('Dialog', () => {
  it('open=true のとき showModal が呼ばれ内容を描画する', () => {
    render(
      <Dialog open title="タイトル">
        本文テキスト
      </Dialog>
    );

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(screen.getByText('タイトル')).toBeInTheDocument();
    expect(screen.getByText('本文テキスト')).toBeInTheDocument();
  });

  it('title を h2 として描画し aria-labelledby で紐付ける', () => {
    render(
      <Dialog open title="確認">
        本文
      </Dialog>
    );

    const heading = screen.getByRole('heading', { level: 2, name: '確認' });
    const dialog = document.querySelector('dialog');

    expect(dialog).toHaveAttribute('aria-labelledby', heading.id);
  });

  it('title 未指定のとき見出しと aria-labelledby を描画しない', () => {
    render(<Dialog open>本文</Dialog>);

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(document.querySelector('dialog')).not.toHaveAttribute('aria-labelledby');
  });

  it('閉じるボタンをデフォルトで描画し、クリックで onClose が呼ばれる', () => {
    const handleClose = vi.fn();
    render(
      <Dialog open title="タイトル" onClose={handleClose}>
        本文
      </Dialog>
    );

    fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('showCloseButton=false のとき閉じるボタンを描画しない', () => {
    render(
      <Dialog open title="タイトル" showCloseButton={false}>
        本文
      </Dialog>
    );

    expect(screen.queryByRole('button', { name: '閉じる' })).not.toBeInTheDocument();
  });

  it('footer を描画する', () => {
    render(
      <Dialog open title="タイトル" footer={<button>決定</button>}>
        本文
      </Dialog>
    );

    expect(screen.getByRole('button', { name: '決定' })).toBeInTheDocument();
  });

  it('footer 未指定のとき描画しない', () => {
    render(
      <Dialog open title="タイトル">
        本文
      </Dialog>
    );

    expect(screen.queryByRole('button', { name: '決定' })).not.toBeInTheDocument();
  });

  it('オーバーレイ（dialog 要素自身）クリックで onClose が呼ばれる', () => {
    const handleClose = vi.fn();
    render(
      <Dialog open title="タイトル" onClose={handleClose}>
        本文
      </Dialog>
    );

    const dialog = document.querySelector('dialog');
    if (dialog === null) {
      throw new Error('dialog が見つかりません');
    }
    fireEvent.click(dialog);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('closeOnOverlayClick=false のときオーバーレイクリックで閉じない', () => {
    const handleClose = vi.fn();
    render(
      <Dialog open title="タイトル" onClose={handleClose} closeOnOverlayClick={false}>
        本文
      </Dialog>
    );

    const dialog = document.querySelector('dialog');
    if (dialog === null) {
      throw new Error('dialog が見つかりません');
    }
    fireEvent.click(dialog);

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('本文クリックでは onClose が呼ばれない', () => {
    const handleClose = vi.fn();
    render(
      <Dialog open title="タイトル" onClose={handleClose}>
        本文テキスト
      </Dialog>
    );

    fireEvent.click(screen.getByText('本文テキスト'));

    expect(handleClose).not.toHaveBeenCalled();
  });

  it('open=true のとき body のスクロールをロックし、閉じると復帰する', () => {
    const { rerender } = render(
      <Dialog open title="タイトル">
        本文
      </Dialog>
    );

    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Dialog open={false} title="タイトル">
        本文
      </Dialog>
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('open=false のとき body のスクロールをロックしない', () => {
    render(
      <Dialog open={false} title="タイトル">
        本文
      </Dialog>
    );

    expect(document.body.style.overflow).toBe('');
  });

  it('open=false のとき showModal を呼ばない', () => {
    vi.clearAllMocks();
    render(
      <Dialog open={false} title="タイトル">
        本文
      </Dialog>
    );

    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  });
});
