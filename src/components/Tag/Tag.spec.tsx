import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Tag } from './Tag';

describe('Tag', () => {
  // ラベルは省略表示のため span に包まれているので、className / variant は 1 つ外側に付く
  const getRoot = () => screen.getByText('タグ名').parentElement;

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

  it('className を付与する', () => {
    render(<Tag label="タグ名" className="custom-class" />);

    expect(getRoot()).toHaveClass('custom-class');
  });

  it('variant によって適用されるクラスが変わる', () => {
    const { rerender } = render(<Tag label="タグ名" />);
    const defaultClassName = getRoot()?.className;

    rerender(<Tag label="タグ名" variant="red" />);

    expect(getRoot()?.className).not.toBe(defaultClassName);
  });
});
