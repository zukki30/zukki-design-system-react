import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { isRenderable } from '@/utils/renderableNode';

import { useFormFieldState } from '../FormField/FormFieldContext';
import { Icon } from '../Icon/Icon';

import { select, selectField, selectIcon } from './Select.css';

type Props = {
  /**
   * 未選択時に表示するプレースホルダー
   */
  placeholder?: string;
  /**
   * セレクトのエラー状態。未指定のときは FormField のエラー状態を引き継ぐ
   */
  error?: boolean;
  /**
   * セレクトの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
  /**
   * option 要素
   */
  children?: ReactNode;
} & Omit<ComponentPropsWithRef<'select'>, 'prefix' | 'suffix'>;

const ICON_SIZE = 20;

export const Select = ({
  placeholder,
  error: errorProp,
  disabled: disabledProp,
  className,
  children,
  value,
  defaultValue,
  ...props
}: Props) => {
  const { error, disabled } = useFormFieldState({ error: errorProp, disabled: disabledProp });

  // 初期選択の行き先が消えないよう、option の描画と初期値の算出は同じ判定を使う
  const hasPlaceholder = isRenderable(placeholder);

  // placeholder 指定かつ未制御・初期値なしのときは空文字を初期選択にして placeholder を表示する
  const resolvedDefaultValue =
    value === undefined && defaultValue === undefined && hasPlaceholder ? '' : defaultValue;

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
        {hasPlaceholder && (
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
