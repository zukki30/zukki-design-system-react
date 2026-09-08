import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { spinner, spinnerVariant } from './Spinner.css';

// 静的な要素は巻き上げる
const TRACK_PATH = (
  <path
    opacity="0.25"
    d="M12 1C18.0752 1 23 5.92487 23 12C23 18.0752 18.0752 23 12 23C5.92487 23 1 18.0752 1 12C1 5.92487 5.92487 1 12 1Z"
  />
);
const ARC_PATH = <path d="M12 1C18.0752 1 23 5.92487 23 12" />;

/**
 * スピナーのバリアント。**下地に何があるかで選ぶ。**
 *
 * - `light` / `dark` … 背景の明暗に合わせる無彩色
 * - `primary` … ページやカードの面の上でブランド色を見せたいとき。`primary.text`
 *   （面に対して読める濃さの段）を描くので、面の上で単体のローディング表示に使う
 * - `accent` … 意味カラーの**塗り**（Button の primary など）に重ねるとき。
 *   `textOnAccent` と同じ色を描く
 *
 * アクセント塗りの上に `light` / `dark` / `primary` を重ねてはいけない。
 * 塗りは両配色とも明るいため、コントラストが足りなくなる
 */
export type SpinnerVariant = 'light' | 'dark' | 'primary' | 'accent';

export type SpinnerProps = {
  /**
   * スピナーのバリアント
   */
  variant?: SpinnerVariant;
  /**
   * The aria-label attribute providing the accessible name of the icon.
   */
  'aria-label'?: string;
} & Omit<ComponentPropsWithRef<'svg'>, 'role' | 'name' | 'aria-label'>;

export const Spinner = ({
  'aria-label': ariaLabel,
  variant = 'light',
  ...restProps
}: SpinnerProps) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      role="img"
      aria-hidden={ariaLabel ? undefined : 'true'}
      {...restProps}
      // restProps より後ろに置く。前に置くとスプレッドの className に丸ごと
      // 上書きされ、ベースと variant のクラスが失われる
      className={clsx(spinner, spinnerVariant[variant], restProps.className)}
    >
      <title>{ariaLabel ?? 'Loading…'}</title>
      {TRACK_PATH}
      {ARC_PATH}
    </svg>
  );
};
