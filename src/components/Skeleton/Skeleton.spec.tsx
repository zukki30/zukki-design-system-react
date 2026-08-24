import { render } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it } from 'vitest';

import { Skeleton } from './Skeleton';
import { skeleton as skeletonClass } from './Skeleton.css';

const renderSkeleton = (ui: ReactElement) => {
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

  it('ネイティブ属性を span に渡す', () => {
    const skeleton = renderSkeleton(<Skeleton id="loading" aria-label="読み込み中" />);

    expect(skeleton).toHaveAttribute('id', 'loading');
    expect(skeleton).toHaveAttribute('aria-label', '読み込み中');
  });

  it('ref を span に転送する', () => {
    const ref = createRef<HTMLSpanElement>();
    const skeleton = renderSkeleton(<Skeleton ref={ref} />);

    expect(ref.current).toBe(skeleton);
  });

  it('style を width / height とマージする', () => {
    const skeleton = renderSkeleton(<Skeleton width="100px" style={{ borderRadius: '4px' }} />);

    expect(skeleton).toHaveStyle({ width: '100px', height: '16px', borderRadius: '4px' });
  });

  it('style の width / height は利用側の指定を優先する', () => {
    const skeleton = renderSkeleton(
      <Skeleton width="100px" height="100px" style={{ width: '50px' }} />
    );

    expect(skeleton).toHaveStyle({ width: '50px', height: '100px' });
  });

  it('data-shape は利用側から上書きできない', () => {
    // data-shape はスタイルの分岐に使うため、shape と食い違わせない
    const skeleton = renderSkeleton(<Skeleton shape="circle" data-shape="rect" />);

    expect(skeleton).toHaveAttribute('data-shape', 'circle');
  });
});
