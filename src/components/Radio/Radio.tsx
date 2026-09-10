import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { isRenderable } from '@/utils/renderableNode';

import { useFormFieldState } from '../FormField/FormFieldContext';

import styles from './Radio.module.css';

export type RadioProps = {
  /**
   * ラジオボタンのラベル
   */
  children?: ReactNode;
  /**
   * ラジオボタンの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'>;

export const Radio = ({ children, disabled: disabledProp, className, ...props }: RadioProps) => {
  const { disabled } = useFormFieldState({ disabled: disabledProp });

  return (
    <label className={clsx(styles.radio, className)} data-disabled={disabled}>
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
