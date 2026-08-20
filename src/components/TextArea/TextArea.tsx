import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { useFormFieldState } from '../FormField/FormFieldContext';

import { textArea } from './TextArea.css';

type Props = {
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
}: Props) => {
  const { error, disabled } = useFormFieldState({ error: errorProp, disabled: disabledProp });

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
