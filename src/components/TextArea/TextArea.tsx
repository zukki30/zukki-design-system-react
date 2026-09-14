import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import type { SizeType } from '@/types';

import { useFormFieldState } from '../FormField/FormFieldContext';

import styles from './TextArea.module.css';

/**
 * テキストエリアのサイズ。`sm` / `md` の 2 段階。
 *
 * `lg` は意図的に持たない。Button / IconButton に `lg` が無いため、
 * 隣にボタンを並べたときに対応する段が無くなる
 */
export type TextAreaSize = Exclude<SizeType, 'lg'>;

export type TextAreaProps = {
  /**
   * テキストエリアのエラー状態。未指定のときは FormField のエラー状態を引き継ぐ
   */
  error?: boolean;
  /**
   * テキストエリアの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
  /**
   * テキストエリアのサイズ。未指定のときは FormField の size を引き継ぐ
   *
   * @default 'md'
   */
  size?: TextAreaSize;
} & Omit<ComponentPropsWithRef<'textarea'>, 'prefix' | 'suffix' | 'size'>;

export const TextArea = ({
  error: errorProp,
  disabled: disabledProp,
  // 既定値を書かないこと。undefined が消えて FormField の size を常に上書きしてしまう
  size: sizeProp,
  className,
  ...props
}: TextAreaProps) => {
  const { error, disabled, size } = useFormFieldState({
    error: errorProp,
    disabled: disabledProp,
    size: sizeProp,
  });

  return (
    <textarea
      className={clsx(styles.textArea, className)}
      disabled={disabled}
      aria-invalid={error}
      {...props}
      // data-* は状態と常に一致させたいので、利用側の props より後に指定して上書きさせない
      data-error={error}
      data-size={size}
    />
  );
};
