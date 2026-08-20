import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { useFormFieldState } from '../FormField/FormFieldContext';

import { radio, radioBox, radioControl, radioDot, radioInput, radioLabel } from './Radio.css';

type Props = {
  /**
   * ラジオボタンのラベル
   */
  children?: React.ReactNode;
  /**
   * ラジオボタンの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'>;

export const Radio = ({ children, disabled: disabledProp, className, ...props }: Props) => {
  const { disabled } = useFormFieldState({ disabled: disabledProp });

  return (
    <label className={clsx(radio, className)} data-disabled={disabled}>
      <span className={radioControl}>
        <input type="radio" className={radioInput} disabled={disabled} {...props} />
        <span className={radioBox} aria-hidden="true">
          <span className={radioDot} />
        </span>
      </span>

      {children != null && <span className={radioLabel}>{children}</span>}
    </label>
  );
};
