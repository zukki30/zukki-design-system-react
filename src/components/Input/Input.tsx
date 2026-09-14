import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import type { ControlSize } from '@/types';

import { useFormFieldState } from '../FormField/FormFieldContext';

import styles from './Input.module.css';

/**
 * 入力のサイズ。`sm` / `md` の 2 段階
 */
export type InputSize = ControlSize;

export type InputProps = {
  /**
   * 入力の前に表示する装飾アイコン。
   * 支援技術からは隠されるため、操作要素や意味のあるテキストは渡さないこと。
   * `0` や `''` などの falsy な値はアイコン未指定として扱い、何も描画しない。
   * 直下の `svg` は大きさを入力欄に合わせて描画される（`size` に応じて 24px / 20px）
   */
  startIcon?: ReactNode;
  /**
   * 入力の後に表示する装飾アイコン。
   * 支援技術からは隠されるため、操作要素や意味のあるテキストは渡さないこと。
   * `0` や `''` などの falsy な値はアイコン未指定として扱い、何も描画しない。
   * 直下の `svg` は大きさを入力欄に合わせて描画される（`size` に応じて 24px / 20px）
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
  /**
   * 入力のサイズ。未指定のときは FormField の size を引き継ぐ
   *
   * @default 'md'
   */
  size?: InputSize;
} & Omit<ComponentPropsWithRef<'input'>, 'prefix' | 'suffix' | 'size'>;

export const Input = ({
  startIcon,
  endIcon,
  error: errorProp,
  disabled: disabledProp,
  // 既定値を書かないこと。undefined が消えて FormField の size を常に上書きしてしまう
  size: sizeProp,
  className,
  ...props
}: InputProps) => {
  const { error, disabled, size } = useFormFieldState({
    error: errorProp,
    disabled: disabledProp,
    size: sizeProp,
  });

  return (
    <div
      className={clsx(styles.input, className)}
      data-error={error}
      data-disabled={disabled}
      data-size={size}
    >
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
