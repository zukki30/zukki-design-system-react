import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { textArea } from './TextArea.css';

type Props = {
  /**
   * テキストエリアのエラー状態
   */
  error?: boolean;
  /**
   * テキストエリアの disabled 属性
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<'textarea'>, 'prefix' | 'suffix'>;

export const TextArea = ({ error, disabled, className, ...props }: Props) => {
  return (
    <textarea
      className={clsx(textArea, className)}
      disabled={disabled}
      data-error={error}
      aria-invalid={error}
      {...props}
    />
  );
};
