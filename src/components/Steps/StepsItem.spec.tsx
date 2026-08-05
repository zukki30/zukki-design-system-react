import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { StepsItem } from './StepsItem';

describe('StepsItem', () => {
  it('ステップ番号とラベルを描画する', () => {
    render(<StepsItem stepNumber={1} label="カート" />);

    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('カート')).toBeInTheDocument();
  });

  it('onClick 未指定のときボタンを描画しない', () => {
    render(<StepsItem stepNumber={1} label="カート" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('onClick 指定時はボタンとして描画し、クリックでステップ番号を渡す', () => {
    const onClick = vi.fn();
    render(<StepsItem stepNumber={2} label="配送先" onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledWith(2);
  });

  it('current のとき aria-current="step" と状態テキストを付与する', () => {
    render(<StepsItem stepNumber={2} label="配送先" current onClick={vi.fn()} />);

    expect(screen.getByRole('button', { name: '2 配送先 現在のステップ' })).toHaveAttribute(
      'aria-current',
      'step'
    );
  });

  it('current でないとき aria-current と状態テキストを付与しない', () => {
    render(<StepsItem stepNumber={2} label="配送先" onClick={vi.fn()} />);

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
    expect(screen.queryByText('現在のステップ')).not.toBeInTheDocument();
  });

  it('current のときステップ番号のスタイルが変わる', () => {
    const { rerender } = render(<StepsItem stepNumber={2} label="配送先" />);
    const defaultClassName = screen.getByText('2').className;

    rerender(<StepsItem stepNumber={2} label="配送先" current />);

    expect(screen.getByText('2').className).not.toBe(defaultClassName);
  });

  it('finished のとき番号ではなく完了アイコンと状態テキストを描画する', () => {
    render(<StepsItem stepNumber={1} label="カート" finished onClick={vi.fn()} />);

    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'カート 完了' })).toBeInTheDocument();
  });

  it('finished と current が同時のときは完了表示を優先する', () => {
    render(<StepsItem stepNumber={1} label="カート" finished current onClick={vi.fn()} />);

    const item = screen.getByRole('button', { name: 'カート 完了' });
    expect(item).toHaveAttribute('aria-current', 'step');
    expect(screen.queryByText('現在のステップ')).not.toBeInTheDocument();
  });
});
