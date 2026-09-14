import { clsx } from 'clsx';
import { type ComponentPropsWithRef, type ReactNode, useEffect, useRef } from 'react';

import { useMergedRef } from '@/hooks/useMergedRef';
import type { ControlSize } from '@/types';
import { isRenderable } from '@/utils/renderableNode';

import { useFormFieldState } from '../FormField/FormFieldContext';
import { Icon } from '../Icon/Icon';

import styles from './Checkbox.module.css';

/**
 * チェックボックスのサイズ。`sm` / `md` の 2 段階。
 *
 * 小さくなるのは箱の見た目とラベルだけで、**クリック領域は 24 × 24 px のまま**
 */
export type CheckboxSize = ControlSize;

export type CheckboxProps = {
  /**
   * チェックボックスのラベル
   */
  children?: ReactNode;
  /**
   * 中間状態
   */
  indeterminate?: boolean;
  /**
   * チェックボックスの disabled 属性。未指定のときは FormField の disabled を引き継ぐ
   */
  disabled?: boolean;
  /**
   * チェックボックスのサイズ。未指定のときは FormField の size を引き継ぐ
   *
   * @default 'md'
   */
  size?: CheckboxSize;
} & Omit<ComponentPropsWithRef<'input'>, 'type' | 'children' | 'size'>;

export const Checkbox = ({
  children,
  indeterminate = false,
  disabled: disabledProp,
  // 既定値を書かないこと。undefined が消えて FormField の size を常に上書きしてしまう
  size: sizeProp,
  className,
  ref,
  ...props
}: CheckboxProps) => {
  const { disabled, size } = useFormFieldState({ disabled: disabledProp, size: sizeProp });
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
    <label className={clsx(styles.checkbox, className)} data-disabled={disabled} data-size={size}>
      <span className={styles.checkbox__control}>
        <input
          ref={mergedRef}
          type="checkbox"
          className={styles.checkbox__input}
          disabled={disabled}
          {...props}
        />
        <span className={styles.checkbox__box} aria-hidden="true">
          {/* 大きさは CSS が持つ（Checkbox.module.css の .checkbox__icon が箱いっぱいに広げる） */}
          <Icon name="outlineCheck" className={styles.checkbox__checkIcon} />
          <Icon name="baselineMinus" className={styles.checkbox__minusIcon} />
        </span>
      </span>

      {isRenderable(children) && <span className={styles.checkbox__label}>{children}</span>}
    </label>
  );
};
