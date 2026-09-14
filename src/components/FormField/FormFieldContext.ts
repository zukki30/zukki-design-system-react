import { createContext, use } from 'react';

import type { ControlSize } from '@/types';
import { toTruthyOrUndefined } from '@/utils/dataAttribute';

/**
 * ラベルの並び方向
 */
export type FormFieldOrientation = 'horizontal' | 'vertical';

/**
 * 必須を示すマークの種類
 */
export type FormFieldRequiredMark = 'badge' | 'asterisk' | 'both';

/**
 * フィールドのサイズ。`sm` / `md` の 2 段階
 */
export type FormFieldSize = ControlSize;

/**
 * フォーム部品の `size` の既定値。
 *
 * 参照するのは `useFormFieldState`（未指定の解決）と `FormField`（自身の
 * `data-size` を出すため）の 2 箇所だけ。各入力コンポーネントには散らさない
 */
export const DEFAULT_FORM_FIELD_SIZE: FormFieldSize = 'md';

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
    /**
     * ラベルと入力欄のサイズ。
     * 入力コンポーネントは自身の `size` が未指定のときこの値を使う
     */
    size: FormFieldSize;
  };
  actions: {
    /**
     * ラベルの id をルートへ登録する。
     *
     * 入力要素と紐付けられないとき（複数のコントロールを並べたときなど）に、
     * ルートを `role="group"` にしてこの id で名前を付けるために使う。
     * 戻り値は登録解除用の関数で、`useEffect` のクリーンアップにそのまま渡せる
     */
    registerLabel: (id: string) => () => void;
    /**
     * 入力要素の id をルートへ登録する。
     *
     * 登録された id は `FormField.Label` の `htmlFor` に反映される。
     * 入力要素が無いときにラベルの参照先が宙に浮くのを防ぐために使う
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
     * 実際に描画されたラベルの id。ラベルが無いときは undefined
     */
    labelId: string | undefined;
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
  /**
   * サイズ
   */
  size?: FormFieldSize;
};

/**
 * `useFormFieldState` が返す、解決済みの状態。
 *
 * `size` だけは常に確定した値になる。`data-size` に `undefined` を出すと
 * 「サイズ指定の無い要素」になり、CSS 側で既定を別に書き分ける必要が生じるためである
 */
export type FormFieldResolvedState = Omit<FormFieldControlState, 'size'> & {
  size: FormFieldSize;
};

/**
 * 入力コンポーネントが FormField のエラー・無効状態とサイズを引き継ぐ。
 *
 * 自身の props で明示された値が常に優先され、未指定のときだけ FormField の状態を使う。
 * FormField の外でも単体で使えるよう、context が無いときは props をそのまま返す
 * （`size` だけは既定の `'md'` へ解決する）。
 *
 * **呼び出し側は `size` に既定値を与えないこと。** 分割代入で `size = 'md'` と書くと
 * `undefined` が消え、FormField の指定を常に上書きしてしまう
 *
 * @example
 * export const Input = ({ error: errorProp, disabled: disabledProp, size: sizeProp, ...props }: Props) => {
 *   const { error, disabled, size } = useFormFieldState({
 *     error: errorProp,
 *     disabled: disabledProp,
 *     size: sizeProp,
 *   });
 * };
 */
export const useFormFieldState = ({
  error,
  disabled,
  size,
}: FormFieldControlState): FormFieldResolvedState => {
  const context = use(FormFieldContext);

  return {
    error: error ?? toTruthyOrUndefined(context?.state.error),
    disabled: disabled ?? toTruthyOrUndefined(context?.state.disabled),
    // 既定値は DEFAULT_FORM_FIELD_SIZE が持つ。各入力コンポーネントに散らさない
    size: size ?? context?.state.size ?? DEFAULT_FORM_FIELD_SIZE,
  };
};
