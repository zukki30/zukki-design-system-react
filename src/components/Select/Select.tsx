import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

import { Icon } from '../Icon/Icon';

import { select, selectField, selectIcon } from './Select.css';

type Props = {
  /**
   * 未選択時に表示するプレースホルダー
   */
  placeholder?: string;
  /**
   * セレクトのエラー状態
   */
  error?: boolean;
  /**
   * セレクトの disabled 属性
   */
  disabled?: boolean;
  /**
   * option 要素
   */
  children?: React.ReactNode;
} & Omit<ComponentPropsWithoutRef<'select'>, 'prefix' | 'suffix'>;

const ICON_SIZE = 20;

export const Select = ({
  placeholder,
  error,
  disabled,
  className,
  children,
  value,
  defaultValue,
  ...props
}: Props) => {
  // placeholder 指定かつ未制御・初期値なしのときは空文字を初期選択にして placeholder を表示する
  const resolvedDefaultValue =
    value === undefined && defaultValue === undefined && placeholder !== undefined
      ? ''
      : defaultValue;

  return (
    <div className={clsx(select, className)} data-error={error} data-disabled={disabled}>
      <select
        className={selectField}
        disabled={disabled}
        aria-invalid={error}
        value={value}
        defaultValue={resolvedDefaultValue}
        {...props}
      >
        {placeholder !== undefined && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>

      <span className={selectIcon} aria-hidden="true">
        <Icon name="chevronDown" width={ICON_SIZE} height={ICON_SIZE} />
      </span>
    </div>
  );
};
