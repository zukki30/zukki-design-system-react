import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';

const renderSkeleton = (ui: React.ReactElement) => {
  const { container } = render(ui);
  const element = container.querySelector('span');

  expect(element).not.toBeNull();

  return element as HTMLSpanElement;
};

describe('Skeleton', () => {
  it('デフォルトでは矩形として描画する', () => {
    const skeleton = renderSkeleton(<Skeleton />);

    expect(skeleton).toHaveAttribute('data-shape', 'rect');
  });

  it('shape="rect" のとき矩形として描画する', () => {
    const skeleton = renderSkeleton(<Skeleton shape="rect" />);

    expect(skeleton).toHaveAttribute('data-shape', 'rect');
  });

  it('shape="circle" のとき円形として描画する', () => {
    const skeleton = renderSkeleton(<Skeleton shape="circle" />);

    expect(skeleton).toHaveAttribute('data-shape', 'circle');
  });

  it('width / height の既定値を適用する', () => {
    const skeleton = renderSkeleton(<Skeleton />);

    expect(skeleton).toHaveStyle({ width: '100%', height: '16px' });
  });

  it('width / height を利用側から指定できる', () => {
    const skeleton = renderSkeleton(<Skeleton width="100px" height="100px" />);

    expect(skeleton).toHaveStyle({ width: '100px', height: '100px' });
  });

  it('className を結合して付与する', () => {
    const skeleton = renderSkeleton(<Skeleton className="custom-class" />);

    expect(skeleton).toHaveClass('custom-class');
    // ベースのクラスが上書きされていないことも確認する
    expect(skeleton.className.split(' ').length).toBeGreaterThan(1);
  });
});
