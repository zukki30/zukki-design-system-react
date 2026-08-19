import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Steps } from './Steps';
import { steps } from './Steps.css';
import { stepsItem } from './StepsItem.css';

const labels = ['カート', '配送先', '確認'];

const getStepElements = () =>
  screen.getAllByRole('listitem').map((item) => {
    const element = item.firstElementChild;
    if (element === null) {
      throw new Error('step element not found');
    }
    return element;
  });

describe('Steps', () => {
  it('全てのラベルを描画する', () => {
    render(<Steps labels={labels} current={1} />);

    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('現在ステップにのみ aria-current="step" を付与する', () => {
    render(<Steps labels={labels} current={2} />);

    const [first, second, third] = getStepElements();
    expect(first).not.toHaveAttribute('aria-current');
    expect(second).toHaveAttribute('aria-current', 'step');
    expect(third).not.toHaveAttribute('aria-current');
  });

  it('現在ステップの状態をテキストでも伝える', () => {
    render(<Steps labels={labels} current={2} />);

    expect(screen.getAllByText('現在のステップ')).toHaveLength(1);
  });

  it('完了ステップの状態をテキストで伝え、番号を描画しない', () => {
    render(<Steps labels={labels} current={3} />);

    // 1・2 番目が完了、3 番目が現在ステップ
    expect(screen.getAllByText('完了')).toHaveLength(2);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('現在値がステップ数を超えるとき最終ステップは完了扱いにしない', () => {
    render(<Steps labels={labels} current={labels.length + 1} />);

    expect(screen.getAllByText('完了')).toHaveLength(labels.length - 1);
    expect(screen.getByText(String(labels.length))).toBeInTheDocument();
    expect(getStepElements().some((element) => element.hasAttribute('aria-current'))).toBe(false);
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

  it('デフォルトでは横並びとして描画する', () => {
    render(<Steps labels={labels} current={1} />);

    screen.getAllByRole('listitem').forEach((item) => {
      expect(item).toHaveAttribute('data-orientation', 'horizontal');
    });
  });

  it('orientation="horizontal" のとき横並びとして描画する', () => {
    render(<Steps labels={labels} current={1} orientation="horizontal" />);

    screen.getAllByRole('listitem').forEach((item) => {
      expect(item).toHaveAttribute('data-orientation', 'horizontal');
    });
  });

  it('orientation="vertical" のとき縦並びとして描画する', () => {
    render(<Steps labels={labels} current={1} orientation="vertical" />);

    screen.getAllByRole('listitem').forEach((item) => {
      expect(item).toHaveAttribute('data-orientation', 'vertical');
    });
  });

  it('orientation ごとに対応する styleVariants のクラスを適用する', () => {
    const { container, rerender } = render(<Steps labels={labels} current={1} />);

    expect(container.querySelector('ol')).toHaveClass(steps.horizontal);

    rerender(<Steps labels={labels} current={1} orientation="vertical" />);

    expect(container.querySelector('ol')).toHaveClass(steps.vertical);
  });

  it('ラベルが重複していても描画できる', () => {
    const duplicated = ['確認', '入力', '確認'];
    render(<Steps labels={duplicated} current={1} />);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getAllByText('確認')).toHaveLength(2);
  });

  // data-orientation は FormField など他コンポーネントも使うため、
  // 祖先の同名属性でスタイルが漏れないことを担保する
  it('外側の要素の data-orientation にスタイルが反応しない', () => {
    const { container } = render(
      <div data-orientation="vertical">
        <Steps labels={labels} current={1} />
      </div>
    );

    const item = container.querySelector(`.${stepsItem}`);

    expect(item).not.toBeNull();
    // 縦並びのときだけ flex-shrink: 0 になる
    expect(getComputedStyle(item as Element).flexShrink).toBe('1');
  });

  it('自身が orientation="vertical" のときは縦並びのスタイルが適用される', () => {
    const { container } = render(<Steps labels={labels} current={1} orientation="vertical" />);

    const item = container.querySelector(`.${stepsItem}`);

    expect(getComputedStyle(item as Element).flexShrink).toBe('0');
  });
});
