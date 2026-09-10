import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { useFormFieldState } from '../FormField/FormFieldContext';

import styles from './TextArea.module.css';

export type TextAreaProps = {
  /**
   * テキストエリアのエラー状態。未指定のときは FormField のエラー状態を引き継ぐ
   */
  error?: boolean;
  /**
   * テキストエリアの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<'textarea'>, 'prefix' | 'suffix'>;

export const TextArea = ({
  error: errorProp,
  disabled: disabledProp,
  className,
  ...props
}: TextAreaProps) => {
  const { error, disabled } = useFormFieldState({ error: errorProp, disabled: disabledProp });

  return (
    <textarea
      className={clsx(styles.textArea, className)}
      disabled={disabled}
      data-error={error}
      aria-invalid={error}
      {...props}
    />
  );
};
