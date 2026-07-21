import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { Tooltip } from './Tooltip';

describe('Tooltip', () => {
  it('対象要素（children）を描画する', () => {
    render(
      <Tooltip content="説明">
        <button>ターゲット</button>
      </Tooltip>,
    );

    expect(screen.getByRole('button', { name: 'ターゲット' })).toBeInTheDocument();
  });

  it('role="tooltip" で content を描画する', () => {
    render(
      <Tooltip content="ツールチップテキスト">
        <span>ターゲット</span>
      </Tooltip>,
    );

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveTextContent('ツールチップテキスト');
  });

  it('ポップアップに popover="manual" を付与する', () => {
    render(
      <Tooltip content="説明">
        <span>ターゲット</span>
      </Tooltip>,
    );

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('popover', 'manual');
  });

  it('aria-describedby が tooltip の id を指す', () => {
    render(
      <Tooltip content="説明">
        <span>ターゲット</span>
      </Tooltip>,
    );

    const tooltip = screen.getByRole('tooltip', { hidden: true });
    const wrapper = tooltip.parentElement;

    expect(wrapper).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('placement を data 属性に反映する（デフォルト top）', () => {
    const { rerender } = render(
      <Tooltip content="説明">
        <span>ターゲット</span>
      </Tooltip>,
    );

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute('data-placement', 'top');

    rerender(
      <Tooltip content="説明" placement="bottomRight">
        <span>ターゲット</span>
      </Tooltip>,
    );

    expect(screen.getByRole('tooltip', { hidden: true })).toHaveAttribute(
      'data-placement',
      'bottomRight',
    );
  });

  it('open=true のとき data-open="true" を付与する', () => {
    render(
      <Tooltip content="説明" open>
        <span>ターゲット</span>
      </Tooltip>,
    );

    expect(screen.getByRole('tooltip', { hidden: true }).parentElement).toHaveAttribute(
      'data-open',
      'true',
    );
  });

  it('open 未指定のとき data-open を付与しない', () => {
    render(
      <Tooltip content="説明">
        <span>ターゲット</span>
      </Tooltip>,
    );

    expect(screen.getByRole('tooltip', { hidden: true }).parentElement).not.toHaveAttribute(
      'data-open',
    );
  });

  it('ネイティブ属性を wrapper に渡す', () => {
    render(
      <Tooltip content="説明" data-testid="tooltip-wrapper">
        <span>ターゲット</span>
      </Tooltip>,
    );

    expect(screen.getByTestId('tooltip-wrapper')).toBeInTheDocument();
  });

  describe('Popover API による表示制御', () => {
    // jsdom は Popover API 未対応のため showPopover / hidePopover をモックする
    let showPopover: ReturnType<typeof vi.fn>;
    let hidePopover: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      showPopover = vi.fn();
      hidePopover = vi.fn();
      // @ts-expect-error jsdom には存在しないメソッドを補う
      HTMLElement.prototype.showPopover = showPopover;
      // @ts-expect-error jsdom には存在しないメソッドを補う
      HTMLElement.prototype.hidePopover = hidePopover;
    });

    afterEach(() => {
      // @ts-expect-error テスト用に追加したメソッドを削除する
      delete HTMLElement.prototype.showPopover;
      // @ts-expect-error テスト用に追加したメソッドを削除する
      delete HTMLElement.prototype.hidePopover;
    });

    it('open=true でマウント時に showPopover を呼ぶ', () => {
      render(
        <Tooltip content="説明" open>
          <span>ターゲット</span>
        </Tooltip>,
      );

      expect(showPopover).toHaveBeenCalled();
    });

    it('ホバーで showPopover、離脱で hidePopover を呼ぶ', () => {
      render(
        <Tooltip content="説明" data-testid="wrapper">
          <span>ターゲット</span>
        </Tooltip>,
      );
      const wrapper = screen.getByTestId('wrapper');

      fireEvent.mouseEnter(wrapper);
      expect(showPopover).toHaveBeenCalled();

      fireEvent.mouseLeave(wrapper);
      expect(hidePopover).toHaveBeenCalled();
    });

    it('フォーカスで showPopover、ブラーで hidePopover を呼ぶ', () => {
      render(
        <Tooltip content="説明" data-testid="wrapper">
          <button>ターゲット</button>
        </Tooltip>,
      );
      const wrapper = screen.getByTestId('wrapper');

      fireEvent.focus(wrapper);
      expect(showPopover).toHaveBeenCalled();

      fireEvent.blur(wrapper);
      expect(hidePopover).toHaveBeenCalled();
    });
  });
});
