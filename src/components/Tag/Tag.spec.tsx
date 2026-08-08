import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Tag } from './Tag';

describe('Tag', () => {
  it('label を描画する', () => {
    render(<Tag label="タグ名" />);

    expect(screen.getByText('タグ名')).toBeInTheDocument();
  });

  it('onClose 未指定のとき閉じるボタンを描画しない', () => {
    render(<Tag label="タグ名" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('onClose 指定時に閉じるボタンを描画する', () => {
    render(<Tag label="タグ名" onClose={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'タグ名を閉じる' })).toBeInTheDocument();
  });

  it('閉じるボタンのクリックで onClose を呼ぶ', () => {
    const onClose = vi.fn();
    render(<Tag label="タグ名" onClose={onClose} />);

    fireEvent.click(screen.getByRole('button', { name: 'タグ名を閉じる' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  // className / variant はルート要素に付く。内部構造に依存しないよう container 側から辿る
  it('className を付与する', () => {
    const { container } = render(<Tag label="タグ名" className="custom-class" />);

    expect(container.firstElementChild).toHaveClass('custom-class');
  });

  it('variant によって適用されるクラスが変わる', () => {
    const { container, rerender } = render(<Tag label="タグ名" />);
    const defaultClassName = container.firstElementChild?.className;

    rerender(<Tag label="タグ名" variant="red" />);

    expect(container.firstElementChild?.className).not.toBe(defaultClassName);
  });
});
