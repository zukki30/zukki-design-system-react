import { clsx } from 'clsx';
import type { CSSProperties } from 'react';

import { skeleton } from './Skeleton.css';

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
   * シェイプの高さ
   */
  className?: string;
  /**
   * 円形のシェイプを使用するかどうか
   */
  circle?: boolean;
};

export const Skeleton = ({ width = '100%', height = '16px', className, circle = false }: Props) => {
  return (
    <span className={clsx(skeleton, className)} data-circle={circle} style={{ width, height }} />
  );
};
