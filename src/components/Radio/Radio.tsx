import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import type { SizeType } from '@/types';
import { isRenderable } from '@/utils/renderableNode';

import { useFormFieldState } from '../FormField/FormFieldContext';

import styles from './Radio.module.css';

/**
 * ラジオボタンのサイズ。`sm` / `md` の 2 段階。
 *
 * 小さくなるのは箱の見た目とラベルだけで、**クリック領域は 24 × 24 px のまま**。
 * `lg` は意図的に持たない（Button / IconButton に `lg` が無いため）
 */
export type RadioSize = Exclude<SizeType, 'lg'>;

export type RadioProps = {
  /**
   * ラジオボタンのラベル
   */
  children?: ReactNode;
  /**
   * ラジオボタンの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
  /**
   * ラジオボタンのサイズ。未指定のときは FormField の size を引き継ぐ
   *
   * @default 'md'
   */
  size?: RadioSize;
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'>;

export const Radio = ({
  children,
  disabled: disabledProp,
  // 既定値を書かないこと。undefined が消えて FormField の size を常に上書きしてしまう
  size: sizeProp,
  className,
  ...props
}: RadioProps) => {
  const { disabled, size } = useFormFieldState({ disabled: disabledProp, size: sizeProp });

  return (
    <label className={clsx(styles.radio, className)} data-disabled={disabled} data-size={size}>
      <span className={styles.radio__control}>
        <input type="radio" className={styles.radio__input} disabled={disabled} {...props} />
        <span className={styles.radio__box} aria-hidden="true">
          <span className={styles.radio__dot} />
        </span>
      </span>

      {isRenderable(children) && <span className={styles.radio__label}>{children}</span>}
    </label>
  );
};
