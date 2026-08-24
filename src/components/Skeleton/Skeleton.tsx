import { clsx } from 'clsx';
import type { ComponentPropsWithRef, CSSProperties } from 'react';

import { skeleton } from './Skeleton.css';

/**
 * シェイプの形状
 */
export type SkeletonShape = 'rect' | 'circle';

type Props = {
  /**
   * シェイプの幅
   * @default '100%'
   */
  width?: CSSProperties['width'];
  /**
   * シェイプの高さ
   * @default '16px'
   */
  height?: CSSProperties['height'];
  /**
   * シェイプの形状
   * @default 'rect'
   */
  shape?: SkeletonShape;
} & ComponentPropsWithRef<'span'>;

/**
 * 読み込み中のプレースホルダー。ref とネイティブ属性は span に転送される
 */
export const Skeleton = ({
  width = '100%',
  height = '16px',
  className,
  shape = 'rect',
  style,
  ...props
}: Props) => {
  return (
    <span
      {...props}
      className={clsx(skeleton, className)}
      // data-shape は shape と常に一致させたいので、利用側の props より後に指定する
      data-shape={shape}
      // width / height は style へ組み立てるため、同じプロパティを style でも
      // 指定されたときは後から展開する利用側を優先する
      style={{ width, height, ...style }}
    />
  );
};
