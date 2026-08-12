import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import {
  switchControl,
  switchInput,
  switchLabel,
  switchRoot,
  switchThumb,
  switchTrack,
} from './Switch.css';

type Props = {
  /**
   * スイッチのラベル
   */
  children?: React.ReactNode;
  /**
   * スイッチの disabled 属性
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size' | 'role'>;

export const Switch = ({ children, disabled, className, ...props }: Props) => {
  return (
    <label className={clsx(switchRoot, className)} data-disabled={disabled}>
      <span className={switchControl}>
        <input
          type="checkbox"
          role="switch"
          className={switchInput}
          disabled={disabled}
          {...props}
        />
        <span className={switchTrack} aria-hidden="true">
          <span className={switchThumb} />
        </span>
      </span>

      {children != null && <span className={switchLabel}>{children}</span>}
    </label>
  );
};
