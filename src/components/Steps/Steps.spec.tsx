import { vars } from '@/styles/theme.css';
import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Steps } from './Steps';
import { steps } from './Steps.css';
import { StepsItem } from './StepsItem';
import { useStepsContext, useStepsItemNumber } from './StepsContext';
import { stepsItem } from './StepsItem.css';

const labels = ['カート', '配送先', '確認'];

// ラベルは重複しうるため key にできない。ステップの同一性は並び順そのものなので index を使う
const stepItems = (items: string[] = labels) =>
  items.map((label, index) => <Steps.Item key={index}>{label}</Steps.Item>);

const getStepElements = () =>
  screen.getAllByRole('listitem').map((item) => {
    const element = item.firstElementChild;
    if (element === null) {
      throw new Error('step element not found');
    }
    return element;
  });

// React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
const silenceReactError = () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
};

describe('Steps', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('全てのラベルを描画する', () => {
    render(<Steps current={1}>{stepItems()}</Steps>);

    labels.forEach((label) => {
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  });

  it('並び順からステップ番号を採番する', () => {
    render(<Steps current={1}>{stepItems()}</Steps>);

    const items = screen.getAllByRole('listitem');
    expect(items[0]).toHaveTextContent('1カート');
    expect(items[1]).toHaveTextContent('2配送先');
    expect(items[2]).toHaveTextContent('3確認');
  });

  it('描画されない子は番号を消費しない', () => {
    const hidden = false;

    render(
      <Steps current={1}>
        <Steps.Item>カート</Steps.Item>
        {hidden && <Steps.Item>クーポン</Steps.Item>}
        <Steps.Item>確認</Steps.Item>
      </Steps>
    );

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(items[1]).toHaveTextContent('2確認');
  });

  it('描画されない子は総数にも数えない', () => {
    const hidden = false;

    render(
      <Steps current={3}>
        <Steps.Item>カート</Steps.Item>
        {hidden && <Steps.Item>クーポン</Steps.Item>}
        <Steps.Item>確認</Steps.Item>
      </Steps>
    );

    // 描画されるのは 2 ステップなので、2 番目は最終ステップとして完了扱いにしない
    expect(screen.getAllByText('完了')).toHaveLength(1);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('現在ステップにのみ aria-current="step" を付与する', () => {
    render(<Steps current={2}>{stepItems()}</Steps>);

    const [first, second, third] = getStepElements();
    expect(first).not.toHaveAttribute('aria-current');
    expect(second).toHaveAttribute('aria-current', 'step');
    expect(third).not.toHaveAttribute('aria-current');
  });

  it('現在ステップの状態をテキストでも伝える', () => {
    render(
      <Steps current={2} onClick={vi.fn()}>
        {stepItems()}
      </Steps>
    );

    expect(screen.getAllByText('現在のステップ')).toHaveLength(1);
    // 番号 → ラベル → 状態の順で連結されることまで確認する
    // （stepsItemStatus の display: block が外れると「配送先現在のステップ」に詰まる）
    expect(screen.getByRole('button', { name: '2 配送先 現在のステップ' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'カート 完了' })).toBeInTheDocument();
  });

  it('完了ステップの状態をテキストで伝え、番号を描画しない', () => {
    render(<Steps current={3}>{stepItems()}</Steps>);

    // 1・2 番目が完了、3 番目が現在ステップ
    expect(screen.getAllByText('完了')).toHaveLength(2);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.queryByText('2')).not.toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('現在値がステップ数を超えるとき最終ステップは完了扱いにしない', () => {
    render(<Steps current={labels.length + 1}>{stepItems()}</Steps>);

    expect(screen.getAllByText('完了')).toHaveLength(labels.length - 1);
    expect(screen.getByText(String(labels.length))).toBeInTheDocument();
    expect(getStepElements().some((element) => element.hasAttribute('aria-current'))).toBe(false);
  });

  it('onClick 未指定のときボタンを描画しない', () => {
    render(<Steps current={1}>{stepItems()}</Steps>);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('onClick 指定時はクリックしたステップ番号を渡す', () => {
    const onClick = vi.fn();
    render(
      <Steps current={1} onClick={onClick}>
        {stepItems()}
      </Steps>
    );

    fireEvent.click(screen.getByRole('button', { name: /確認/ }));

    expect(onClick).toHaveBeenCalledWith(3);
  });

  it('デフォルトでは横並びとして描画する', () => {
    render(<Steps current={1}>{stepItems()}</Steps>);

    screen.getAllByRole('listitem').forEach((item) => {
      expect(item).toHaveAttribute('data-orientation', 'horizontal');
    });
  });

  it('orientation="horizontal" のとき横並びとして描画する', () => {
    render(
      <Steps current={1} orientation="horizontal">
        {stepItems()}
      </Steps>
    );

    screen.getAllByRole('listitem').forEach((item) => {
      expect(item).toHaveAttribute('data-orientation', 'horizontal');
    });
  });

  it('orientation="vertical" のとき縦並びとして描画する', () => {
    render(
      <Steps current={1} orientation="vertical">
        {stepItems()}
      </Steps>
    );

    screen.getAllByRole('listitem').forEach((item) => {
      expect(item).toHaveAttribute('data-orientation', 'vertical');
    });
  });

  it('orientation ごとに対応する styleVariants のクラスを適用する', () => {
    const { container, rerender } = render(<Steps current={1}>{stepItems()}</Steps>);

    expect(container.querySelector('ol')).toHaveClass(steps.horizontal);

    rerender(
      <Steps current={1} orientation="vertical">
        {stepItems()}
      </Steps>
    );

    expect(container.querySelector('ol')).toHaveClass(steps.vertical);
  });

  it('ラベルが重複していても描画できる', () => {
    render(<Steps current={1}>{stepItems(['確認', '入力', '確認'])}</Steps>);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getAllByText('確認')).toHaveLength(2);
  });

  // data-orientation は FormField など他コンポーネントも使うため、
  // 祖先の同名属性でスタイルが漏れないことを担保する
  it('外側の要素の data-orientation にスタイルが反応しない', () => {
    const { container } = render(
      <div data-orientation="vertical">
        <Steps current={1}>{stepItems()}</Steps>
      </div>
    );

    const item = container.querySelector(`.${stepsItem}`);

    expect(item).not.toBeNull();
    // 縦並びのときだけ flex-shrink: 0 になる
    expect(getComputedStyle(item as Element).flexShrink).toBe('1');
  });

  it('自身が orientation="vertical" のときは縦並びのスタイルが適用される', () => {
    const { container } = render(
      <Steps current={1} orientation="vertical">
        {stepItems()}
      </Steps>
    );

    const item = container.querySelector(`.${stepsItem}`);

    expect(getComputedStyle(item as Element).flexShrink).toBe('0');
  });

  describe('Steps.Item', () => {
    it('Steps.Item として公開されている', () => {
      expect(Steps.Item).toBe(StepsItem);
    });

    it('現在ステップは番号のスタイルが変わる', () => {
      const { rerender } = render(<Steps current={1}>{stepItems()}</Steps>);
      const defaultClassName = screen.getByText('2').className;

      rerender(<Steps current={2}>{stepItems()}</Steps>);

      expect(screen.getByText('2').className).not.toBe(defaultClassName);
    });

    // 現在ステップの円は default と形が同じで差が色だけになるため、
    // ラベルの太さを色以外の手がかりにしている（WCAG 1.4.1）
    it('現在ステップのラベルだけを太字にする', () => {
      render(<Steps current={2}>{stepItems()}</Steps>);

      const [finished, current, upcoming] = labels.map((label) => screen.getByText(label));

      expect(getComputedStyle(current).fontWeight).toBe(vars['font-weight'].bold);
      expect(getComputedStyle(finished).fontWeight).toBe(vars['font-weight'].normal);
      expect(getComputedStyle(upcoming).fontWeight).toBe(vars['font-weight'].normal);
    });

    it('現在ステップがないときはどのラベルも太字にしない', () => {
      render(<Steps current={labels.length + 1}>{stepItems()}</Steps>);

      labels.forEach((label) => {
        expect(getComputedStyle(screen.getByText(label)).fontWeight).toBe(
          vars['font-weight'].normal
        );
      });
    });

    it('Steps の外では例外を投げる', () => {
      silenceReactError();

      expect(() => render(<StepsItem>カート</StepsItem>)).toThrow(
        'Steps のサブコンポーネントは <Steps> の内側で使用してください'
      );
    });
  });

  describe('直下の子', () => {
    it('Fragment で包むと例外を投げる', () => {
      silenceReactError();

      expect(() =>
        render(
          <Steps current={1}>
            <>
              <Steps.Item>カート</Steps.Item>
              <Steps.Item>確認</Steps.Item>
            </>
          </Steps>
        )
      ).toThrow('Steps の直下に Fragment は置けません。');
    });

    // context のフックを公開しているため、利用側は独自のパーツを直下に置ける
    it('独自のパーツにも context と採番が届く', () => {
      const CustomItem = () => {
        const {
          state: { current, total, orientation },
        } = useStepsContext();
        const stepNumber = useStepsItemNumber();

        return <li>{`${stepNumber}/${total} current=${current} orientation=${orientation}`}</li>;
      };

      render(
        <Steps current={2} orientation="vertical">
          <Steps.Item>カート</Steps.Item>
          <CustomItem />
        </Steps>
      );

      expect(screen.getByText('2/2 current=2 orientation=vertical')).toBeInTheDocument();
    });
  });
});
