import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';
import { skeleton as skeletonClass } from './Skeleton.css';

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

  it('className をベースのクラスに結合して付与する', () => {
    const skeleton = renderSkeleton(<Skeleton className="custom-class" />);

    // 上書きではなくマージであることを、ベースのクラスが残っているかで確認する
    expect(skeleton).toHaveClass(skeletonClass, 'custom-class');
  });
});
