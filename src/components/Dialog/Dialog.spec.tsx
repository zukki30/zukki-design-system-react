import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, useState } from 'react';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { iconButtonSize, iconButtonVariant } from '../IconButton/IconButton.css';

import { Dialog } from './index';

const classesOf = (className: string) => className.split(' ');

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
    // Escape も <form method="dialog"> も、最終的にはネイティブの close イベントに集約される。
    // cancel を個別に拾わないのは、Escape のときだけ二重に通知されるのを避けるため
    it('native の close イベントで onClose が呼ばれる（Escape 経由もここに集約される）', () => {
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

    it('cancel イベントは既定動作に任せ、単体では onClose を呼ばない', () => {
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

      // 実ブラウザでは cancel を止めなければ続けて close が発火する。
      // cancel だけで通知すると、その close と合わせて 2 回呼ばれてしまう
      fireEvent(dialogElement, new Event('cancel', { bubbles: false, cancelable: true }));

      expect(handleClose).not.toHaveBeenCalled();
    });

    it('open=false のまま閉じたときは onClose を呼ばない', () => {
      const handleClose = vi.fn();
      const { rerender } = render(
        <Dialog open onClose={handleClose}>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      // 利用側が open を false にしたときの close は、利用側が既に閉じると決めた結果なので
      // 通知しない（通知すると 1 回の操作で onClose が 2 回呼ばれる）
      rerender(
        <Dialog open={false} onClose={handleClose}>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      expect(handleClose).not.toHaveBeenCalled();
    });
  });

  describe('制御された Dialog での通知回数', () => {
    const ControlledDialog = ({ onCloseSpy }: { onCloseSpy: () => void }) => {
      const [open, setOpen] = useState(true);

      return (
        <Dialog
          open={open}
          onClose={() => {
            onCloseSpy();
            setOpen(false);
          }}
        >
          <Dialog.Header>
            <Dialog.Close />
          </Dialog.Header>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );
    };

    it('オーバーレイクリックで onClose が 1 回だけ呼ばれる', () => {
      const spy = vi.fn();
      render(<ControlledDialog onCloseSpy={spy} />);

      const dialogElement = document.querySelector('dialog');
      if (dialogElement === null) {
        throw new Error('dialog element not found');
      }

      fireEvent.click(dialogElement);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('Dialog.Close のクリックで onClose が 1 回だけ呼ばれる', () => {
      const spy = vi.fn();
      render(<ControlledDialog onCloseSpy={spy} />);

      fireEvent.click(screen.getByRole('button', { name: '閉じる' }));

      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('利用側の props と内部の配線', () => {
    it('onClick を渡してもオーバーレイクリックで閉じる', () => {
      const handleClose = vi.fn();
      const handleClick = vi.fn();
      render(
        <Dialog open onClose={handleClose} onClick={handleClick}>
          <Dialog.Body>本文</Dialog.Body>
        </Dialog>
      );

      const dialogElement = document.querySelector('dialog');
      if (dialogElement === null) {
        throw new Error('dialog element not found');
      }

      fireEvent.click(dialogElement);

      expect(handleClick).toHaveBeenCalledTimes(1);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });

    it('onClick で preventDefault すると閉じない', () => {
      const handleClose = vi.fn();
      render(
        <Dialog
          open
          onClose={handleClose}
          onClick={(event) => {
            event.preventDefault();
          }}
        >
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

    it('aria-labelledby を明示すると利用側の指定が優先される', () => {
      render(
        <Dialog open aria-labelledby="external-heading">
          <Dialog.Header>
            <Dialog.Title>タイトル</Dialog.Title>
          </Dialog.Header>
        </Dialog>
      );

      expect(document.querySelector('dialog')).toHaveAttribute(
        'aria-labelledby',
        'external-heading'
      );
    });

    it('Dialog.Close は既定で secondary-exposed / sm で描画する', () => {
      render(
        <Dialog open>
          <Dialog.Header>
            <Dialog.Close data-testid="close" />
          </Dialog.Header>
        </Dialog>
      );

      const closeButton = screen.getByTestId('close');

      expect(closeButton).toHaveClass(...classesOf(iconButtonVariant['secondary-exposed']));
      expect(closeButton).toHaveClass(...classesOf(iconButtonSize.sm));
    });

    // {...props} を先に展開しても、意図的に受け取っている見た目の prop は上書きできる
    it('Dialog.Close の variant / size は上書きできる', () => {
      render(
        <Dialog open>
          <Dialog.Header>
            <Dialog.Close variant="primary" size="md" data-testid="close" />
          </Dialog.Header>
        </Dialog>
      );

      const closeButton = screen.getByTestId('close');

      expect(closeButton).toHaveClass(...classesOf(iconButtonVariant.primary));
      expect(closeButton).toHaveClass(...classesOf(iconButtonSize.md));
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

  // useDialogContext のテストは DialogContext.spec.tsx にある
});
