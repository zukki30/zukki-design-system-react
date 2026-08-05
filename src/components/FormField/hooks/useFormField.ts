import { Children, Fragment, cloneElement, isValidElement, useId } from 'react';
import type { ReactNode } from 'react';

/**
 * FormField が入力要素（children）へ注入する属性
 */
type ControlAriaProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
};

type UseFormFieldParams = {
  /**
   * ラベルと紐付ける入力要素の id
   */
  htmlFor?: string;
  /**
   * 必須項目かどうか
   */
  required: boolean;
  /**
   * 補助テキストを表示するかどうか
   */
  hasHelperText: boolean;
  /**
   * エラーメッセージを表示するかどうか
   */
  hasErrorText: boolean;
  /**
   * 入力要素
   */
  children: ReactNode;
};

type UseFormFieldResult = {
  /**
   * label の htmlFor に指定する id。紐付け先がないときは undefined
   */
  controlId: string | undefined;
  /**
   * 補助テキストの id
   */
  helperTextId: string;
  /**
   * エラーメッセージの id
   */
  errorTextId: string;
  /**
   * id / aria を注入した入力要素
   */
  control: ReactNode;
};

/**
 * id を半角スペース区切りで結合する。結合結果が空なら undefined を返す
 */
const joinIds = (ids: (string | undefined)[]) => {
  const joined = ids.filter((id) => id !== undefined && id !== '').join(' ');

  return joined === '' ? undefined : joined;
};

/**
 * ラベル・補助テキスト・エラーメッセージを入力要素へ紐付けるための id と ARIA 属性を組み立てる。
 *
 * children が単一の要素のときだけ属性を注入し、複数要素やテキストのときは何もしない。
 * その場合は利用側で `htmlFor` と入力要素の `id` を指定する必要がある。
 */
export const useFormField = ({
  htmlFor,
  required,
  hasHelperText,
  hasErrorText,
  children,
}: UseFormFieldParams): UseFormFieldResult => {
  const reactId = useId();

  const helperTextId = `${reactId}-helper-text`;
  const errorTextId = `${reactId}-error-text`;

  // Fragment は props を受け取れないため注入対象から除外する
  const control =
    Children.count(children) === 1 &&
    isValidElement<ControlAriaProps>(children) &&
    children.type !== Fragment
      ? children
      : undefined;

  if (control === undefined) {
    // 注入先がないまま id を生成すると label の htmlFor が存在しない要素を指してしまう
    return { controlId: htmlFor, helperTextId, errorTextId, control: children };
  }

  const controlId = htmlFor ?? control.props.id ?? `${reactId}-control`;

  return {
    controlId,
    helperTextId,
    errorTextId,
    control: cloneElement(control, {
      id: controlId,
      // 入力要素が自身で指定している値は捨てずに結合する
      'aria-describedby': joinIds([
        control.props['aria-describedby'],
        hasHelperText ? helperTextId : undefined,
        hasErrorText ? errorTextId : undefined,
      ]),
      'aria-required': control.props['aria-required'] ?? (required ? true : undefined),
    }),
  };
};
