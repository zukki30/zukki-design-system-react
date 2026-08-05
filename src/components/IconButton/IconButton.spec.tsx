import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Icon } from '../Icon';

import { IconButton } from './IconButton';

const icon = <Icon name="home" width={16} height={16} />;

const renderSpinnerClassName = (
  variant: 'primary' | 'secondary' | 'primary-exposed' | 'secondary-exposed'
) => {
  const { container, unmount } = render(
    <IconButton aria-label="ホーム" variant={variant} loading>
      {icon}
    </IconButton>
  );
  const spinner = container.querySelector('[class*="spinner"]');
  if (spinner === null) {
    throw new Error('spinner not found');
  }
  // SVG 要素の className は SVGAnimatedString のため属性値で比較する
  const className = spinner.getAttribute('class');
  unmount();

  return className;
};

describe('IconButton', () => {
  it('aria-label をアクセシブルネームとして描画する', () => {
    render(<IconButton aria-label="ホーム">{icon}</IconButton>);

    expect(screen.getByRole('button', { name: 'ホーム' })).toBeInTheDocument();
  });

  it('aria-label を省略すると型エラーになる（実行時は描画される）', () => {
    // @ts-expect-error アイコンのみのボタンのため aria-label は必須
    render(<IconButton>{icon}</IconButton>);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('クリックで onClick を呼ぶ', () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="ホーム" onClick={onClick}>
        {icon}
      </IconButton>
    );

    fireEvent.click(screen.getByRole('button', { name: 'ホーム' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled のときクリックしても onClick を呼ばない', () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="ホーム" onClick={onClick} disabled>
        {icon}
      </IconButton>
    );

    const button = screen.getByRole('button', { name: 'ホーム' });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('loading のとき Spinner を描画する', () => {
    const { container } = render(
      <IconButton aria-label="ホーム" loading>
        {icon}
      </IconButton>
    );

    expect(screen.getByRole('button', { name: 'ホーム' })).toHaveAttribute('data-loading', 'true');
    expect(container.querySelector('[class*="spinner"]')).toBeInTheDocument();
  });

  it('loading でないとき Spinner を描画しない', () => {
    const { container } = render(<IconButton aria-label="ホーム">{icon}</IconButton>);

    expect(container.querySelector('[class*="spinner"]')).not.toBeInTheDocument();
  });

  it('variant に応じて Spinner の配色を切り替える', () => {
    const primary = renderSpinnerClassName('primary');
    const secondary = renderSpinnerClassName('secondary');
    const primaryExposed = renderSpinnerClassName('primary-exposed');
    const secondaryExposed = renderSpinnerClassName('secondary-exposed');

    // primary / secondary はどちらも dark
    expect(secondary).toBe(primary);
    expect(primaryExposed).not.toBe(primary);
    expect(secondaryExposed).not.toBe(primary);
    expect(secondaryExposed).not.toBe(primaryExposed);
  });
});
