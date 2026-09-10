import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { useFormFieldState } from '../FormField/FormFieldContext';

import styles from './Input.module.css';

export type InputProps = {
  /**
   * 入力の前に表示する装飾アイコン。
   * 支援技術からは隠されるため、操作要素や意味のあるテキストは渡さないこと。
   * `0` や `''` などの falsy な値はアイコン未指定として扱い、何も描画しない
   */
  startIcon?: ReactNode;
  /**
   * 入力の後に表示する装飾アイコン。
   * 支援技術からは隠されるため、操作要素や意味のあるテキストは渡さないこと。
   * `0` や `''` などの falsy な値はアイコン未指定として扱い、何も描画しない
   */
  endIcon?: ReactNode;
  /**
   * 入力のエラー状態。未指定のときは FormField のエラー状態を引き継ぐ
   */
  error?: boolean;
  /**
   * 入力の disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<'input'>, 'prefix' | 'suffix'>;

export const Input = ({
  startIcon,
  endIcon,
  error: errorProp,
  disabled: disabledProp,
  className,
  ...props
}: InputProps) => {
  const { error, disabled } = useFormFieldState({ error: errorProp, disabled: disabledProp });

  return (
    <div className={clsx(styles.input, className)} data-error={error} data-disabled={disabled}>
      {startIcon ? (
        <span className={styles.input__icon} data-position="start" aria-hidden="true">
          {startIcon}
        </span>
      ) : null}

      <input className={styles.input__field} disabled={disabled} aria-invalid={error} {...props} />

      {endIcon ? (
        <span className={styles.input__icon} data-position="end" aria-hidden="true">
          {endIcon}
        </span>
      ) : null}
    </div>
  );
};
