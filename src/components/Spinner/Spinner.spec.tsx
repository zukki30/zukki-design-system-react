import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Spinner } from './Spinner';

describe('Spinner', () => {
  it('aria-label 未指定のとき装飾として隠し、既定のタイトルを持つ', () => {
    const { container } = render(<Spinner />);

    const svg = container.querySelector('svg');

    expect(svg).toHaveAttribute('aria-hidden', 'true');
    // 三点リーダは 1 文字の … を使う（. の 3 連続だと読み上げが冗長になる）
    expect(container.querySelector('title')).toHaveTextContent('Loading…');
  });

  it('aria-label 指定のとき隠さず、アクセシブルネームとして使う', () => {
    render(<Spinner aria-label="読み込み中" />);

    const svg = screen.getByRole('img', { name: '読み込み中' });

    expect(svg).not.toHaveAttribute('aria-hidden');
  });

  it.each([
    ['light', 'dark'],
    ['dark', 'primary'],
    ['primary', 'light'],
  ] as const)('variant=%s と variant=%s でスタイルが変わる', (variant, otherVariant) => {
    const { rerender } = render(<Spinner aria-label="読み込み中" variant={variant} />);
    const className = screen.getByRole('img', { name: '読み込み中' }).getAttribute('class');

    rerender(<Spinner aria-label="読み込み中" variant={otherVariant} />);

    expect(screen.getByRole('img', { name: '読み込み中' }).getAttribute('class')).not.toBe(
      className
    );
  });

  it('className をベースのクラスとマージする', () => {
    const { rerender } = render(<Spinner aria-label="読み込み中" />);
    const baseClassName = screen.getByRole('img', { name: '読み込み中' }).getAttribute('class');

    rerender(<Spinner aria-label="読み込み中" className="custom-class" />);

    // 上書きではなくマージであることを、ベースのクラスが残っているかで確認する
    const merged = screen.getByRole('img', { name: '読み込み中' }).getAttribute('class');
    expect(merged).toContain('custom-class');
    expect(merged).toContain(baseClassName);
  });
});
