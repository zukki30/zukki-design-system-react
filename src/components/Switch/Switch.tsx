import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import type { ControlSize } from '@/types';
import { isRenderable } from '@/utils/renderableNode';

import { useFormFieldState } from '../FormField/FormFieldContext';

import styles from './Switch.module.css';

/**
 * スイッチのサイズ。`sm` / `md` の 2 段階。
 *
 * 小さくなるのはトラックの見た目とラベルだけで、**クリック領域の高さは 24 px のまま**
 */
export type SwitchSize = ControlSize;

export type SwitchProps = {
  /**
   * スイッチのラベル
   */
  children?: ReactNode;
  /**
   * スイッチの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
  /**
   * スイッチのサイズ。未指定のときは FormField の size を引き継ぐ
   *
   * @default 'md'
   */
  size?: SwitchSize;
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size' | 'role'>;

export const Switch = ({
  children,
  disabled: disabledProp,
  // 既定値を書かないこと。undefined が消えて FormField の size を常に上書きしてしまう
  size: sizeProp,
  className,
  ...props
}: SwitchProps) => {
  const { disabled, size } = useFormFieldState({ disabled: disabledProp, size: sizeProp });

  return (
    <label className={clsx(styles.switch, className)} data-disabled={disabled} data-size={size}>
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
