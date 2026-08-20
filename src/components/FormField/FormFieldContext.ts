import { createContext, use } from 'react';

/**
 * ラベルの並び方向
 */
export type FormFieldOrientation = 'horizontal' | 'vertical';

/**
 * 必須を示すマークの種類
 */
export type FormFieldRequiredMark = 'badge' | 'asterisk' | 'both';

/**
 * FormField がサブコンポーネントへ共有する値。
 *
 * 利用側が独自のパーツ（単位付きの補助テキストなど）を作るときは
 * `useFormFieldContext()` からこの値を参照する
 */
export type FormFieldContextValue = {
  state: {
    /**
     * 必須項目かどうか
     */
    required: boolean;
    /**
     * 必須マークの種類
     */
    requiredMark: FormFieldRequiredMark;
    /**
     * 入力欄を無効化するかどうか
     */
    disabled: boolean;
    /**
     * エラー状態かどうか。
     * ルートの `error` が未指定のときは `FormField.ErrorText` の描画有無から決まる
     */
    error: boolean;
  };
  actions: {
    /**
     * 入力要素の id をルートへ登録する。
     *
     * 登録された id は `FormField.Label` の `htmlFor` に反映される。
     * 入力要素が無いときにラベルの参照先が宙に浮くのを防ぐために使う。
     * 戻り値は登録解除用の関数で、`useEffect` のクリーンアップにそのまま渡せる
     */
    registerControl: (id: string) => () => void;
    /**
     * 補助テキストの id をルートへ登録する。
     * 登録された id は入力要素の `aria-describedby` に反映される
     */
    registerHelperText: (id: string) => () => void;
    /**
     * エラーメッセージの id をルートへ登録する。
     * `aria-describedby` に加えて、フィールド全体のエラー状態にも反映される
     */
    registerErrorText: (id: string) => () => void;
  };
  meta: {
    /**
     * 入力要素が自前の `id` を持たないときに割り当てる id
     */
    controlId: string;
    /**
     * 実際に描画された入力要素の id。入力要素が無いときは undefined
     */
    labelledControlId: string | undefined;
    /**
     * 説明テキスト（補助テキスト・エラーメッセージ）の id を結合したもの。
     * どちらも描画されていないときは undefined
     */
    describedBy: string | undefined;
  };
};

export const FormFieldContext = createContext<FormFieldContextValue | null>(null);

/**
 * FormField の context を取得する。`<FormField>` の外側で呼ぶと例外を投げる
 */
export const useFormFieldContext = (): FormFieldContextValue => {
  const context = use(FormFieldContext);

  if (context === null) {
    throw new Error('FormField のサブコンポーネントは <FormField> の内側で使用してください');
  }

  return context;
};

/**
 * 入力コンポーネントが FormField から引き継ぐ状態
 */
export type FormFieldControlState = {
  /**
   * エラー状態
   */
  error?: boolean;
  /**
   * 無効化されているかどうか
   */
  disabled?: boolean;
};

/**
 * `false` を undefined に潰す。
 * 属性として出力したときに `data-error="false"` のような無意味な値を増やさないため
 */
const toTruthyOrUndefined = (value: boolean | undefined): true | undefined =>
  value === true ? true : undefined;

/**
 * 入力コンポーネントが FormField のエラー・無効状態を引き継ぐ。
 *
 * 自身の props で明示された値が常に優先され、未指定のときだけ FormField の状態を使う。
 * FormField の外でも単体で使えるよう、context が無いときは props をそのまま返す
 *
 * @example
 * export const Input = ({ error: errorProp, disabled: disabledProp, ...props }: Props) => {
 *   const { error, disabled } = useFormFieldState({ error: errorProp, disabled: disabledProp });
 * };
 */
export const useFormFieldState = ({
  error,
  disabled,
}: FormFieldControlState): FormFieldControlState => {
  const context = use(FormFieldContext);

  return {
    error: error ?? toTruthyOrUndefined(context?.state.error),
    disabled: disabled ?? toTruthyOrUndefined(context?.state.disabled),
  };
};
