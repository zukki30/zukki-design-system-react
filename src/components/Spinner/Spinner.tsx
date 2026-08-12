import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

import { spinner, spinnerVariant } from './Spinner.css';

// props に依存しない静的な図形はモジュールスコープへ巻き上げ、再レンダーのたびに作り直さない
const TRACK_PATH = (
  <path
    opacity="0.25"
    d="M12 1C18.0752 1 23 5.92487 23 12C23 18.0752 18.0752 23 12 23C5.92487 23 1 18.0752 1 12C1 5.92487 5.92487 1 12 1Z"
  />
);
const ARC_PATH = <path d="M12 1C18.0752 1 23 5.92487 23 12" />;

type Props = {
  variant?: 'light' | 'dark' | 'primary';
  /**
   * The aria-label attribute providing the accessible name of the icon.
   */
  'aria-label'?: string;
} & Omit<ComponentPropsWithoutRef<'svg'>, 'role' | 'name' | 'aria-label'>;

export const Spinner = ({ 'aria-label': ariaLabel, variant = 'light', ...restProps }: Props) => {
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
