import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Icon } from './Icon';

describe('Icon', () => {
  it('aria-label 指定時はアクセシブルな名前を持つ', () => {
    render(<Icon name="home" aria-label="ホーム" />);

    const icon = screen.getByRole('img', { name: 'ホーム' });

    expect(icon).not.toHaveAttribute('aria-hidden');
  });

  it('aria-label 未指定時は支援技術から隠す', () => {
    const { container } = render(<Icon name="home" />);

    const icon = container.querySelector('svg');

    expect(icon).toHaveAttribute('aria-hidden', 'true');
    // title には name がフォールバックとして入る
    expect(icon?.querySelector('title')).toHaveTextContent('home');
  });

  it('ネイティブ属性を svg に渡す', () => {
    render(<Icon name="close" aria-label="閉じる" width={16} height={16} />);

    const icon = screen.getByRole('img', { name: '閉じる' });

    expect(icon).toHaveAttribute('width', '16');
    expect(icon).toHaveAttribute('height', '16');
  });

  it('ref を svg に転送する', () => {
    const ref = createRef<SVGSVGElement>();
    render(<Icon ref={ref} name="home" aria-label="ホーム" />);

    expect(ref.current).toBe(screen.getByRole('img', { name: 'ホーム' }));
  });
});
