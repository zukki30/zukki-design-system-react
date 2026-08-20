import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { Dialog, useDialogContext } from './index';

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

describe('Dialog', () => {
  it('open=true のとき showModal が呼ばれ内容を描画する', () => {
    render(
      <Dialog open>
        <Dialog.Header>
          <Dialog.Title>タイトル</Dialog.Title>
        </Dialog.Header>
        <Dialog.Body>本文テキスト</Dialog.Body>
      </Dialog>
    );

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(screen.getByText('タイトル')).toBeInTheDocument();
    expect(screen.getByText('本文テキスト')).toBeInTheDocument();
  });

  it('open=false のとき showModal を呼ばない', () => {
    vi.clearAllMocks();
    render(
      <Dialog open={false}>
        <Dialog.Body>本文</Dialog.Body>
      </Dialog>
    );

    expect(HTMLDialogElement.prototype.showModal).not.toHaveBeenCalled();
  });

  describe('Dialog.Title', () => {
    it('h2 として描画し aria-labelledby で紐付ける', () => {
      render(
        <Dialog open>
          <Dialog.Header>
            <Dialog.Title>確認</Dialog.Title>
          </Dialog.Header>
        </Dialog>
      );

      const heading = screen.getByRole('heading', { level: 2, name: '確認' });

      expect(document.querySelector('dialog')).toHaveAttribute('aria-labelledby', heading.id);
    });

    it('描画しないとき aria-labelledby を付与しない', () => {
      render(
        <Dialog open aria-label="お知らせ">
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      expect(document.querySelector('dialog')).not.toHaveAttribute('aria-labelledby');
    });

    it('アンマウントされると aria-labelledby が外れる', () => {
      const { rerender } = render(
        <Dialog open>
          <Dialog.Header>
            <Dialog.Title>確認</Dialog.Title>
          </Dialog.Header>
        </Dialog>
      );

      expect(document.querySelector('dialog')).toHaveAttribute('aria-labelledby');

      rerender(
        <Dialog open>
          <Dialog.Header />
        </Dialog>
      );

      expect(document.querySelector('dialog')).not.toHaveAttribute('aria-labelledby');
    });

    it('className を結合して付与する', () => {
      render(
        <Dialog open>
          <Dialog.Title className="custom-class">確認</Dialog.Title>
        </Dialog>
      );

      expect(screen.getByRole('heading', { level: 2 })).toHaveClass('custom-class');
    });

    it('複数描画しても id が重複せず、すべてが aria-labelledby に並ぶ', () => {
      render(
        <Dialog open>
          <Dialog.Title>ひとつめ</Dialog.Title>
          <Dialog.Title>ふたつめ</Dialog.Title>
        </Dialog>
      );

      const headings = screen.getAllByRole('heading', { level: 2 });
      const ids = headings.map((heading) => heading.id);

      expect(new Set(ids).size).toBe(2);
      expect(document.querySelector('dialog')?.getAttribute('aria-labelledby')?.split(' ')).toEqual(
        expect.arrayContaining(ids)
      );
    });

    it('複数のうち 1 つを外しても、残ったタイトルとの紐付けは維持される', () => {
      const { rerender } = render(
        <Dialog open>
          <Dialog.Title key="first">ひとつめ</Dialog.Title>
          <Dialog.Title key="second">ふたつめ</Dialog.Title>
        </Dialog>
      );

      rerender(
        <Dialog open>
          <Dialog.Title key="second">ふたつめ</Dialog.Title>
        </Dialog>
      );

      const heading = screen.getByRole('heading', { level: 2, name: 'ふたつめ' });

      expect(document.querySelector('dialog')).toHaveAttribute('aria-labelledby', heading.id);
    });
  });

  describe('Dialog.Close', () => {
    it('クリックで onClose が呼ばれる', () => {
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose}>
          <Dialog.Header>
            <Dialog.Close />
          </Dialog.Header>
        </Dialog>
      );

      fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('描画しないとき閉じるボタンは存在しない', () => {
      render(
        <Dialog open>
          <Dialog.Header>
            <Dialog.Title>タイトル</Dialog.Title>
          </Dialog.Header>
        </Dialog>
      );

      expect(screen.queryByRole('button', { name: '閉じる' })).not.toBeInTheDocument();
    });

    it('aria-label を上書きできる', () => {
      render(
        <Dialog open>
          <Dialog.Close aria-label="ダイアログを閉じる" />
        </Dialog>
      );

      expect(screen.getByRole('button', { name: 'ダイアログを閉じる' })).toBeInTheDocument();
    });

    it('利用側の onClick を呼んだうえで閉じる', () => {
      const handleClick = vi.fn();
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose}>
          <Dialog.Close onClick={handleClick} />
        </Dialog>
      );

      fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('children で内容を差し替えられる', () => {
      render(
        <Dialog open>
          <Dialog.Close aria-label="閉じる">×</Dialog.Close>
        </Dialog>
      );

      expect(screen.getByRole('button', { name: '閉じる' })).toHaveTextContent('×');
    });

    it('onClick で preventDefault すると閉じない', () => {
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose}>
          <Dialog.Close onClick={(event) => event.preventDefault()} />
        </Dialog>
      );

      fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('onClose 未指定でもクリックで例外にならない', () => {
      render(
        <Dialog open>
          <Dialog.Close />
        </Dialog>
      );

      expect(() => fireEvent.click(screen.getByRole('button', { name: '閉じる' }))).not.toThrow();
    });
  });

  describe('Dialog.Header / Body / Footer', () => {
    it('描画したパーツだけが存在する', () => {
      render(
        <Dialog open>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      const dialogElement = document.querySelector('dialog');

      expect(screen.getByText('本文')).toBeInTheDocument();
      // 合成していないパーツは要素ごと存在しない
      expect(dialogElement?.childElementCount).toBe(1);
    });

    it('footer の内容を描画する', () => {
      render(
        <Dialog open>
          <Dialog.Footer>
            <button type="button">OK</button>
          </Dialog.Footer>
        </Dialog>
      );

      expect(screen.getByRole('button', { name: 'OK' })).toBeInTheDocument();
    });

    it('ネイティブ属性と className を渡せる', () => {
      render(
        <Dialog open>
          <Dialog.Header data-testid="header" className="custom-header" />
          <Dialog.Body data-testid="body" className="custom-body" />
          <Dialog.Footer data-testid="footer" className="custom-footer" />
        </Dialog>
      );

      expect(screen.getByTestId('header')).toHaveClass('custom-header');
      expect(screen.getByTestId('body')).toHaveClass('custom-body');
      expect(screen.getByTestId('footer')).toHaveClass('custom-footer');
    });
  });

  describe('オーバーレイクリック', () => {
    it('dialog 要素自身のクリックで onClose が呼ばれる', () => {
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose}>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      const dialogElement = document.querySelector('dialog');
      if (dialogElement === null) {
        throw new Error('dialog element not found');
      }

      fireEvent.click(dialogElement);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('closeOnOverlayClick=false のとき閉じない', () => {
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose} closeOnOverlayClick={false}>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      const dialogElement = document.querySelector('dialog');
      if (dialogElement === null) {
        throw new Error('dialog element not found');
      }

      fireEvent.click(dialogElement);

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('本文クリックでは onClose が呼ばれない', () => {
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose}>
          <Dialog.Body>本文テキスト</Dialog.Body>
        </Dialog>
      );

      fireEvent.click(screen.getByText('本文テキスト'));

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('onClose 未指定でも例外にならない', () => {
      render(
        <Dialog open>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      const dialogElement = document.querySelector('dialog');
      if (dialogElement === null) {
        throw new Error('dialog element not found');
      }

      expect(() => fireEvent.click(dialogElement)).not.toThrow();
    });
  });

  describe('ネイティブイベント', () => {
    it('Escape キー（cancel イベント）で onClose が呼ばれる', () => {
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose}>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      const dialogElement = document.querySelector('dialog');
      if (dialogElement === null) {
        throw new Error('dialog element not found');
      }

      fireEvent(dialogElement, new Event('cancel', { bubbles: false, cancelable: true }));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('native の close イベントで onClose が呼ばれる', () => {
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose}>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      const dialogElement = document.querySelector('dialog');
      if (dialogElement === null) {
        throw new Error('dialog element not found');
      }

      fireEvent(dialogElement, new Event('close'));

      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('余白', () => {
    const getDialogElement = () => {
      const dialogElement = document.querySelector('dialog');
      if (dialogElement === null) {
        throw new Error('dialog element not found');
      }

      return dialogElement;
    };

    // ヘッダーが任意になったため、上余白はルートではなく先頭のパーツが持つ。
    // ルートが上余白を持つと、ヘッダー未合成のときに本文の余白と二重になる
    it('ルートは上余白を持たず、合成するパーツによらず一定である', () => {
      const { unmount } = render(
        <Dialog open>
          <Dialog.Header>
            <Dialog.Title>タイトル</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      expect(getComputedStyle(getDialogElement()).paddingTop).toBe('0px');

      unmount();

      render(
        <Dialog open aria-label="お知らせ">
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      expect(getComputedStyle(getDialogElement()).paddingTop).toBe('0px');
    });
  });

  describe('ref', () => {
    it('ref を dialog に転送する', () => {
      const ref = createRef<HTMLDialogElement>();
      render(
        <Dialog ref={ref} open>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      expect(ref.current).toBe(document.querySelector('dialog'));
    });

    it('ref を渡しても open の変化が showModal / close に同期される', () => {
      vi.clearAllMocks();
      const ref = createRef<HTMLDialogElement>();
      const { rerender } = render(
        <Dialog ref={ref} open={false}>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      rerender(
        <Dialog ref={ref} open>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalledTimes(1);

      rerender(
        <Dialog ref={ref} open={false}>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      expect(HTMLDialogElement.prototype.close).toHaveBeenCalledTimes(1);
    });
  });

  describe('useDialogContext', () => {
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

    it('利用側のパーツから開閉状態と閉じる操作を参照できる', () => {
      const handleClose = vi.fn();
      render(
        <Dialog open onClose={handleClose}>
          <Dialog.Footer>
            <CustomCloseButton />
          </Dialog.Footer>
        </Dialog>
      );

      const button = screen.getByRole('button', { name: '開いている' });
      fireEvent.click(button);

      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('Dialog の外側で使うと例外を投げる', () => {
      // React が投げたエラーをコンソールへ出すため、テスト出力を汚さないよう抑制する
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(<CustomCloseButton />)).toThrow(
        'Dialog のサブコンポーネントは <Dialog> の内側で使用してください'
      );

      consoleError.mockRestore();
    });
  });
});
