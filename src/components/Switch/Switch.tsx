import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { isRenderable } from '@/utils/renderableNode';

import { useFormFieldState } from '../FormField/FormFieldContext';

import styles from './Switch.module.css';

export type SwitchProps = {
  /**
   * スイッチのラベル
   */
  children?: ReactNode;
  /**
   * スイッチの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size' | 'role'>;

export const Switch = ({ children, disabled: disabledProp, className, ...props }: SwitchProps) => {
  const { disabled } = useFormFieldState({ disabled: disabledProp });

  return (
    <label className={clsx(styles.switch, className)} data-disabled={disabled}>
      <span className={styles.switch__control}>
        <input
          type="checkbox"
          role="switch"
          className={styles.switch__input}
          disabled={disabled}
          {...props}
        />
        <span className={styles.switch__track} aria-hidden="true">
          <span className={styles.switch__thumb} />
        </span>
      </span>

      {isRenderable(children) && <span className={styles.switch__label}>{children}</span>}
    </label>
  );
};
