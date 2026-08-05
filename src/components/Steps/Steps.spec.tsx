import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Steps } from './Steps';
import { steps } from './Steps.css';

const labels = ['カート', '配送先', '確認'];

const getStepElements = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('li > *'));

describe('Steps', () => {
  it('全てのラベルを描画する', () => {
    render(<Steps labels={labels} current={1} />);

    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('現在ステップにのみ aria-current="step" を付与する', () => {
    const { container } = render(<Steps labels={labels} current={2} />);

    const [first, second, third] = getStepElements(container);
    expect(first).not.toHaveAttribute('aria-current');
    expect(second).toHaveAttribute('aria-current', 'step');
    expect(third).not.toHaveAttribute('aria-current');
  });

  it('現在ステップの状態をテキストでも伝える', () => {
    render(<Steps labels={labels} current={2} />);

    expect(screen.getAllByText('現在のステップ')).toHaveLength(1);
  });

  it('完了ステップの状態をアイコンの代替テキストで伝える', () => {
    render(<Steps labels={labels} current={3} />);

    // 1・2 番目が完了、3 番目が現在ステップ
    expect(screen.getAllByRole('img', { name: '完了' })).toHaveLength(2);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('現在値がステップ数を超えるとき最終ステップは完了扱いにしない', () => {
    const { container } = render(<Steps labels={labels} current={labels.length + 1} />);

    expect(screen.getAllByRole('img', { name: '完了' })).toHaveLength(labels.length - 1);
    expect(screen.getByText(String(labels.length))).toBeInTheDocument();
    expect(getStepElements(container).some((el) => el.hasAttribute('aria-current'))).toBe(false);
  });

  it('onClick 未指定のときボタンを描画しない', () => {
    render(<Steps labels={labels} current={1} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('onClick 指定時はクリックしたステップ番号を渡す', () => {
    const onClick = vi.fn();
    render(<Steps labels={labels} current={1} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button', { name: /確認/ }));

    expect(onClick).toHaveBeenCalledWith(3);
  });

  it('vertical に応じて ol と li のスタイルを切り替える', () => {
    const { container: horizontal } = render(<Steps labels={labels} current={1} />);
    expect(horizontal.querySelector('ol')).toHaveClass(...steps.horizontal.split(' '));
    expect(horizontal.querySelector('li')).toHaveAttribute('data-vertical', 'false');

    const { container: vertical } = render(<Steps labels={labels} current={1} vertical />);
    expect(vertical.querySelector('ol')).toHaveClass(...steps.vertical.split(' '));
    expect(vertical.querySelector('li')).toHaveAttribute('data-vertical', 'true');
  });
});
