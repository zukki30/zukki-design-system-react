import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

import { radio, radioBox, radioControl, radioDot, radioInput, radioLabel } from './Radio.css';

type Props = {
  /**
   * ラジオボタンのラベル
   */
  children?: React.ReactNode;
  /**
   * ラジオボタンの disabled 属性
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'children' | 'size'>;

export const Radio = ({ children, disabled, className, ...props }: Props) => {
  return (
    <label className={clsx(radio, className)} data-disabled={disabled}>
      <span className={radioControl}>
        <input type="radio" className={radioInput} disabled={disabled} {...props} />
        <span className={radioBox} aria-hidden="true">
          <span className={radioDot} />
        </span>
      </span>

      {children != null && <span className={radioLabel}>{children}</span>}
    </label>
  );
};
