import { clsx } from 'clsx';
import { Children, cloneElement, isValidElement, useId } from 'react';
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

/**
 * FormField が入力要素（children）へ注入する属性
 */
type ControlAriaProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
};

/**
 * id を半角スペース区切りで結合する。結合結果が空なら undefined を返す
 */
const joinIds = (ids: (string | undefined)[]) => {
  const joined = ids.filter((id) => id !== undefined && id !== '').join(' ');

  return joined === '' ? undefined : joined;
};

type Props = {
  /**
   * フィールドのラベル
   */
  label?: ReactNode;
  /**
   * ラベルと紐付ける入力要素の id（label の htmlFor）。
   * 省略時は children の id、それもなければ自動生成した id を children に注入する
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
  const reactId = useId();

  const showAsterisk = required && (requiredMark === 'asterisk' || requiredMark === 'both');
  const showBadge = required && (requiredMark === 'badge' || requiredMark === 'both');

  // 入力要素が単一の要素のときだけ id / aria を注入する（複数要素やテキストはそのまま描画）
  const control =
    Children.count(children) === 1 && isValidElement<ControlAriaProps>(children)
      ? children
      : undefined;

  const controlId = htmlFor ?? control?.props.id ?? `${reactId}-control`;
  const helperTextId = `${reactId}-helper-text`;
  const errorTextId = `${reactId}-error-text`;

  const renderedControl =
    control === undefined
      ? children
      : cloneElement(control, {
          id: controlId,
          // 入力要素が自身で指定している値は捨てずに結合する
          'aria-describedby': joinIds([
            control.props['aria-describedby'],
            helperText !== undefined ? helperTextId : undefined,
            errorText !== undefined ? errorTextId : undefined,
          ]),
          'aria-required': control.props['aria-required'] ?? (required ? true : undefined),
        });

  return (
    <div
      className={clsx(formField, className)}
      data-orientation={orientation}
      data-disabled={disabled}
      {...props}
    >
      {label !== undefined && (
        <div className={formFieldLabelContainer}>
          <label className={formFieldLabel} htmlFor={controlId}>
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
        {renderedControl}
        {helperText !== undefined && (
          <p className={formFieldHelperText} id={helperTextId}>
            {helperText}
          </p>
        )}
        {/* エラーは表示された時点で支援技術に通知する必要があるため role="alert" を付与する */}
        {errorText !== undefined && (
          <p className={formFieldErrorText} id={errorTextId} role="alert">
            {errorText}
          </p>
        )}
      </div>
    </div>
  );
};
