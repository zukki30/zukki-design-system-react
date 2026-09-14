import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import type { ControlSize } from '@/types';
import { isRenderable } from '@/utils/renderableNode';

import { useFormFieldState } from '../FormField/FormFieldContext';
import { Icon } from '../Icon/Icon';

import styles from './Select.module.css';

/**
 * セレクトのサイズ。`sm` / `md` の 2 段階
 */
export type SelectSize = ControlSize;

export type SelectProps = {
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
   * セレクトのサイズ。未指定のときは FormField の size を引き継ぐ
   *
   * @default 'md'
   */
  size?: SelectSize;
  /**
   * option 要素
   */
  children?: ReactNode;
} & Omit<ComponentPropsWithRef<'select'>, 'prefix' | 'suffix' | 'size'>;

export const Select = ({
  placeholder,
  error: errorProp,
  disabled: disabledProp,
  // 既定値を書かないこと。undefined が消えて FormField の size を常に上書きしてしまう
  size: sizeProp,
  className,
  children,
  value,
  defaultValue,
  ...props
}: SelectProps) => {
  const { error, disabled, size } = useFormFieldState({
    error: errorProp,
    disabled: disabledProp,
    size: sizeProp,
  });

  // 初期選択の行き先が消えないよう、option の描画と初期値の算出は同じ判定を使う
  const hasPlaceholder = isRenderable(placeholder);

  // placeholder 指定かつ未制御・初期値なしのときは空文字を初期選択にして placeholder を表示する
  const resolvedDefaultValue =
    value === undefined && defaultValue === undefined && hasPlaceholder ? '' : defaultValue;

  return (
    <div
      className={clsx(styles.select, className)}
      data-error={error}
      data-disabled={disabled}
      data-size={size}
    >
      <select
        className={styles.select__field}
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

      <span className={styles.select__icon} aria-hidden="true">
        {/* サイズは CSS が持つ（Select.module.css の --zds-select-icon-size） */}
        <Icon name="chevronDown" />
      </span>
    </div>
  );
};
