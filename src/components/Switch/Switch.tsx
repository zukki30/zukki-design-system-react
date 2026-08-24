import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { isRenderable } from '@/utils/renderableNode';

import { useFormFieldState } from '../FormField/FormFieldContext';

import {
  switchControl,
  switchInput,
  switchLabel,
  switchRoot,
  switchThumb,
  switchTrack,
} from './Switch.css';

type Props = {
  /**
   * スイッチのラベル
   */
  children?: ReactNode;
  /**
   * スイッチの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size' | 'role'>;

export const Switch = ({ children, disabled: disabledProp, className, ...props }: Props) => {
  const { disabled } = useFormFieldState({ disabled: disabledProp });

  return (
    <label className={clsx(switchRoot, className)} data-disabled={disabled}>
      <span className={switchControl}>
        <input
          type="checkbox"
          role="switch"
          className={switchInput}
          disabled={disabled}
          {...props}
        />
        <span className={switchTrack} aria-hidden="true">
          <span className={switchThumb} />
        </span>
      </span>

      {isRenderable(children) && <span className={switchLabel}>{children}</span>}
    </label>
  );
};
