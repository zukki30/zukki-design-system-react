import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import {
  formField,
  formFieldControl,
  formFieldErrorText,
  formFieldHelperText,
  formFieldLabel,
  formFieldLabelContainer,
  formFieldRequiredAsterisk,
  formFieldRequiredBadge,
} from './FormField.css';

/**
 * ラベルの並び方向
 */
export type FormFieldOrientation = 'horizontal' | 'vertical';

/**
 * 必須を示すマークの種類
 */
export type FormFieldRequiredMark = 'badge' | 'asterisk' | 'both';

type Props = {
  /**
   * フィールドのラベル
   */
  label?: ReactNode;
  /**
   * ラベルと紐付ける入力要素の id（label の htmlFor）
   */
  htmlFor?: string;
  /**
   * ラベルと入力欄の並び方向
   * @default 'horizontal'
   */
  orientation?: FormFieldOrientation;
  /**
   * 必須項目かどうか。true のとき必須マークを表示する
   */
  required?: boolean;
  /**
   * 必須マークの種類
   * @default 'badge'
   */
  requiredMark?: FormFieldRequiredMark;
  /**
   * 入力欄を無効化された表示にする
   */
  disabled?: boolean;
  /**
   * 入力欄の下に表示する補助テキスト
   */
  helperText?: ReactNode;
  /**
   * 入力欄の下に表示するエラーメッセージ
   */
  errorText?: ReactNode;
  /**
   * 入力欄本体（Input・Select など）
   */
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<'div'>, 'children'>;

export const FormField = ({
  label,
  htmlFor,
  orientation = 'horizontal',
  required = false,
  requiredMark = 'badge',
  disabled = false,
  helperText,
  errorText,
  children,
  className,
  ...props
}: Props) => {
  const showAsterisk = required && (requiredMark === 'asterisk' || requiredMark === 'both');
  const showBadge = required && (requiredMark === 'badge' || requiredMark === 'both');

  return (
    <div
      className={clsx(formField, className)}
      data-orientation={orientation}
      data-disabled={disabled}
      {...props}
    >
      {label !== undefined && (
        <div className={formFieldLabelContainer}>
          <label className={formFieldLabel} htmlFor={htmlFor}>
            {label}
            {showAsterisk && (
              <span className={formFieldRequiredAsterisk} aria-hidden="true">
                *
              </span>
            )}
            {showBadge && <span className={formFieldRequiredBadge}>必須</span>}
          </label>
        </div>
      )}

      <div className={formFieldControl}>
        {children}
        {helperText !== undefined && <p className={formFieldHelperText}>{helperText}</p>}
        {errorText !== undefined && <p className={formFieldErrorText}>{errorText}</p>}
      </div>
    </div>
  );
};
