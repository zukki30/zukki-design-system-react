import { clsx } from 'clsx';
import type { CSSProperties } from 'react';

import { skeleton } from './Skeleton.css';

/**
 * シェイプの形状
 */
export type SkeletonShape = 'rect' | 'circle';

type Props = {
  /**
   * シェイプの幅
   */
  width?: CSSProperties['width'];
  /**
   * シェイプの高さ
   */
  height?: CSSProperties['height'];
  /**
   * 追加のクラス名
   */
  className?: string;
  /**
   * シェイプの形状
   * @default 'rect'
   */
  shape?: SkeletonShape;
};

export const Skeleton = ({ width = '100%', height = '16px', className, shape = 'rect' }: Props) => {
  return (
    <span className={clsx(skeleton, className)} data-shape={shape} style={{ width, height }} />
  );
};
