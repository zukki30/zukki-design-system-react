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

    expect(screen.getByRole('button')).toHaveAttribute('aria-current', 'step');
    expect(screen.getByText('現在のステップ')).toBeInTheDocument();
  });

  it('current でないとき aria-current と状態テキストを付与しない', () => {
    render(<StepsItem stepNumber={2} label="配送先" onClick={vi.fn()} />);

    expect(screen.getByRole('button')).not.toHaveAttribute('aria-current');
    expect(screen.queryByText('現在のステップ')).not.toBeInTheDocument();
  });

  it('finished のとき番号ではなく代替テキスト付きの完了アイコンを描画する', () => {
    render(<StepsItem stepNumber={1} label="カート" finished />);

    expect(screen.queryByText('1')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: '完了' })).toBeInTheDocument();
  });
});
