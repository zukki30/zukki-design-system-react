import { clsx } from 'clsx';
import { type ComponentPropsWithRef, useEffect, useRef } from 'react';

import { useMergedRef } from '@/hooks/useMergedRef';
import { isRenderable } from '@/utils/renderableNode';

import { useFormFieldState } from '../FormField/FormFieldContext';
import { Icon } from '../Icon/Icon';

import {
  checkbox,
  checkboxBox,
  checkboxCheckIcon,
  checkboxControl,
  checkboxInput,
  checkboxLabel,
  checkboxMinusIcon,
} from './Checkbox.css';

type Props = {
  /**
   * チェックボックスのラベル
   */
  children?: React.ReactNode;
  /**
   * 中間状態
   */
  indeterminate?: boolean;
  /**
   * チェックボックスの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'>;

const ICON_SIZE = 24;

export const Checkbox = ({
  children,
  indeterminate = false,
  disabled: disabledProp,
  className,
  ref,
  ...props
}: Props) => {
  const { disabled } = useFormFieldState({ disabled: disabledProp });
  const inputRef = useRef<HTMLInputElement>(null);
  const mergedRef = useMergedRef(ref, inputRef);

  // indeterminate は DOM プロパティのため HTML 属性では表現できない。
  // ブラウザはクリック時に indeterminate を false へ落とすため、
  // prop の変化だけでなく毎コミット同期する（依存配列を持たせない）
  useEffect(() => {
    if (inputRef.current !== null) {
      inputRef.current.indeterminate = indeterminate;
    }
  });

  return (
    <label className={clsx(checkbox, className)} data-disabled={disabled}>
      <span className={checkboxControl}>
        <input
          ref={mergedRef}
          type="checkbox"
          className={checkboxInput}
          disabled={disabled}
          {...props}
        />
        <span className={checkboxBox} aria-hidden="true">
          <Icon
            name="outlineCheck"
            width={ICON_SIZE}
            height={ICON_SIZE}
            className={checkboxCheckIcon}
          />
          <Icon
            name="baselineMinus"
            width={ICON_SIZE}
            height={ICON_SIZE}
            className={checkboxMinusIcon}
          />
        </span>
      </span>

      {isRenderable(children) && <span className={checkboxLabel}>{children}</span>}
    </label>
  );
};
