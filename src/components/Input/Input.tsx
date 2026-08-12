import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef } from 'react';

import { input, inputField, inputIcon } from './Input.css';

type Props = {
  /**
   * 入力の前に表示する装飾アイコン。
   * 支援技術からは隠されるため、操作要素や意味のあるテキストは渡さないこと
   */
  startIcon?: React.ReactNode;
  /**
   * 入力の後に表示する装飾アイコン。
   * 支援技術からは隠されるため、操作要素や意味のあるテキストは渡さないこと
   */
  endIcon?: React.ReactNode;
  /**
   * 入力のエラー状態
   */
  error?: boolean;
  /**
   * 入力の disabled 属性
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<'input'>, 'prefix' | 'suffix'>;

export const Input = ({ startIcon, endIcon, error, disabled, className, ...props }: Props) => {
  return (
    <div className={clsx(input, className)} data-error={error} data-disabled={disabled}>
      {startIcon ? (
        <span className={inputIcon} data-position="start" aria-hidden="true">
          {startIcon}
        </span>
      ) : null}

      <input className={inputField} disabled={disabled} aria-invalid={error} {...props} />

      {endIcon ? (
        <span className={inputIcon} data-position="end" aria-hidden="true">
          {endIcon}
        </span>
      ) : null}
    </div>
  );
};
