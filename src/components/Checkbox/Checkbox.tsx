import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

import { Icon } from '../Icon/Icon';

import {
  checkbox,
  checkboxBox,
  checkboxCheckIcon,
  checkboxControl,
  checkboxInput,
  checkboxLabel,
  checkboxMinusIcon,
} from './Checkbox.css';

type Props = {
  /**
   * チェックボックスのラベル
   */
  children?: React.ReactNode;
  /**
   * 中間状態
   */
  indeterminate?: boolean;
  /**
   * チェックボックスの disabled 属性
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'children' | 'size'>;

const ICON_SIZE = 24;

export const Checkbox = ({
  children,
  indeterminate = false,
  disabled,
  className,
  ...props
}: Props) => {
  // indeterminate は DOM プロパティのため ref callback 経由で設定する（HTML 属性では表現できない）
  const setInputRef = (input: HTMLInputElement | null) => {
    if (input !== null) {
      input.indeterminate = indeterminate;
    }
  };

  return (
    <label className={clsx(checkbox, className)} data-disabled={disabled}>
      <span className={checkboxControl}>
        <input
          ref={setInputRef}
          type="checkbox"
          className={checkboxInput}
          disabled={disabled}
          {...props}
        />
        <span className={checkboxBox} aria-hidden="true">
          <Icon
            name="outlineCheck"
            width={ICON_SIZE}
            height={ICON_SIZE}
            className={checkboxCheckIcon}
          />
          <Icon
            name="baselineMinus"
            width={ICON_SIZE}
            height={ICON_SIZE}
            className={checkboxMinusIcon}
          />
        </span>
      </span>

      {children != null && <span className={checkboxLabel}>{children}</span>}
    </label>
  );
};
