import { Children, Fragment, cloneElement, isValidElement, useEffect, useId } from 'react';
import type { ReactNode } from 'react';

/**
 * FormField が入力要素へ注入する属性。
 * どれも DOM の属性として妥当なため、素の `<input>` にもコンポーネントにも注入できる
 */
type ControlProps = {
  id?: string;
  disabled?: boolean;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
  'aria-invalid'?: boolean;
};

type UseFormFieldControlParams = {
  /**
   * 入力欄として描画する子
   */
  children: ReactNode;
  /**
   * 説明テキスト（補助テキスト・エラーメッセージ）の id
   */
  describedBy: string | undefined;
  /**
   * 必須項目かどうか
   */
  required: boolean;
  /**
   * エラー状態かどうか
   */
  error: boolean;
  /**
   * 無効化されているかどうか
   */
  disabled: boolean;
  /**
   * 実際に使う id をルートへ登録する。戻り値は登録解除用の関数
   */
  registerControl: (id: string) => () => void;
};

/**
 * `disabled` を持てる素の HTML 要素。
 * これ以外（`<div>` など）へ注入すると不正な属性になるため対象から外す
 */
const DISABLEABLE_TAGS = new Set([
  'button',
  'fieldset',
  'input',
  'optgroup',
  'option',
  'select',
  'textarea',
]);

/**
 * 子要素へ `disabled` を注入してよいか。
 * コンポーネントは自身で受け取り方を決められるため、素の HTML 要素だけを判定する
 */
const acceptsDisabled = (type: unknown): boolean =>
  typeof type === 'string' ? DISABLEABLE_TAGS.has(type) : true;

/**
 * id を半角スペース区切りで結合する。結合結果が空なら undefined を返す
 */
const joinIds = (ids: (string | undefined)[]) => {
  const joined = ids.filter((id) => id !== undefined && id !== '').join(' ');

  return joined === '' ? undefined : joined;
};

/**
 * `FormField.Control` の子要素へ id と ARIA 属性を注入する。
 *
 * 子が単一の要素のときだけ注入し、複数要素やテキストのときは何もしない
 * （Fragment は props を受け取れないため対象外）。
 * その場合は入力要素の `id` と ARIA 属性を利用側で指定する必要がある。
 *
 * 注入した id はルートへ登録され、`FormField.Label` の `htmlFor` に反映される。
 * id は `FormField.Control` のインスタンスごとに採番するため、
 * 1 つの FormField に複数の Control を置いても DOM の id は重複しない
 */
export const useFormFieldControl = ({
  children,
  describedBy,
  required,
  error,
  disabled,
  registerControl,
}: UseFormFieldControlParams): ReactNode => {
  const fallbackControlId = useId();

  // Fragment は props を受け取れないため注入対象から除外する
  const control =
    Children.count(children) === 1 &&
    isValidElement<ControlProps>(children) &&
    children.type !== Fragment
      ? children
      : undefined;

  // 入力要素が自前の id を持つ場合はそちらを尊重する（外部から参照されている可能性があるため）
  const controlId = control === undefined ? undefined : (control.props.id ?? fallbackControlId);

  // 描画されている間だけ id を登録する（registerControl は登録解除用の関数を返す）
  useEffect(() => {
    if (controlId === undefined) {
      return;
    }

    return registerControl(controlId);
  }, [registerControl, controlId]);

  if (control === undefined || controlId === undefined) {
    return children;
  }

  return cloneElement(control, {
    id: controlId,
    // 入力要素が自身で指定している値は捨てずに結合する
    'aria-describedby': joinIds([control.props['aria-describedby'], describedBy]),
    // 明示された値があればそれを優先し、無いときだけ FormField の状態を反映する
    'aria-required': control.props['aria-required'] ?? (required ? true : undefined),
    'aria-invalid': control.props['aria-invalid'] ?? (error ? true : undefined),
    disabled:
      control.props.disabled ?? (disabled && acceptsDisabled(control.type) ? true : undefined),
  });
};
