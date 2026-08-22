import { clsx } from 'clsx';
import { type ComponentPropsWithRef, useEffect, useId, useMemo } from 'react';

import { useIdRegistry } from '@/hooks/useIdRegistry';
import { toTruthyOrUndefined } from '@/utils/dataAttribute';

import {
  formField,
  formFieldControl,
  formFieldErrorText,
  formFieldHelperText,
  formFieldLabel,
  formFieldRequiredAsterisk,
  formFieldRequiredBadge,
} from './FormField.css';
import {
  FormFieldContext,
  type FormFieldContextValue,
  type FormFieldOrientation,
  type FormFieldRequiredMark,
  useFormFieldContext,
} from './FormFieldContext';
import { useFormFieldControl } from './hooks';

export type FormFieldProps = {
  /**
   * ラベルと入力欄の並び方向
   * @default 'horizontal'
   */
  orientation?: FormFieldOrientation;
  /**
   * 必須項目かどうか。true のとき `FormField.Label` に必須マークを表示し、
   * 入力要素へ `aria-required` を伝播する
   */
  required?: boolean;
  /**
   * 必須マークの種類
   * @default 'badge'
   */
  requiredMark?: FormFieldRequiredMark;
  /**
   * 入力欄を無効化する。ラベルの表示と入力要素の `disabled` の両方に反映される
   */
  disabled?: boolean;
  /**
   * エラー状態。入力要素の `error` / `aria-invalid` に反映される。
   *
   * 未指定のときは `FormField.ErrorText` を描画しているかどうかで決まるため、
   * 通常は指定しなくてよい。エラーメッセージを出さずにエラー表示だけしたい場合や、
   * 初回描画から確実にエラー状態にしたい場合に指定する
   */
  error?: boolean;
} & ComponentPropsWithRef<'div'>;

/**
 * ラベル・補助テキスト・エラーメッセージをまとめて扱うフォームフィールド。
 *
 * 中身は `FormField.Label` / `FormField.Control` / `FormField.HelperText` /
 * `FormField.ErrorText` を合成して組み立てる。各パーツの有無は、描画するかどうかで表現する。
 *
 * `required` / `disabled` / エラー状態は context 経由で入力要素へ自動的に伝播するため、
 * `<Input error disabled>` のように入力要素側で指定し直す必要はない。
 *
 * **パーツはルートの直下に置くこと。**
 * 横並びのレイアウトはルートの grid で組んでいるため、
 * パーツを別の要素で囲むと列の割り当てが崩れる。
 *
 * **id を使う紐付けはマウント後に確定する。**
 * ルートからは子孫の描画有無を検査できないため、パーツ側から id を登録してもらっている。
 * 登録は `useEffect` で行うため、`htmlFor` / `aria-describedby` と
 * `FormField.ErrorText` 由来のエラー状態は初回のコミットでは未反映で、直後の再レンダーで付く。
 * 初回描画からエラー表示を確定させたい場合は `error` を明示する。
 * サーバー描画では effect が走らないため、ハイドレーション前の HTML にこれらは含まれない
 *
 * @example
 * <FormField required>
 *   <FormField.Label>メールアドレス</FormField.Label>
 *   <FormField.Control>
 *     <Input type="email" />
 *   </FormField.Control>
 *   <FormField.HelperText>会社のアドレスを入力してください</FormField.HelperText>
 *   {error !== undefined && <FormField.ErrorText>{error}</FormField.ErrorText>}
 * </FormField>
 */
// サブコンポーネントをプロパティとしてぶら下げるため、ここだけ関数宣言で定義する
// （アロー関数だと後から FormField.Label 等を生やせない）
export function FormField({
  orientation = 'horizontal',
  required = false,
  requiredMark = 'badge',
  disabled = false,
  error,
  className,
  children,
  // グループとしての名前付けは利用側から上書きできるようにする
  role,
  'aria-labelledby': ariaLabelledBy,
  ...props
}: FormFieldProps) {
  const [labelIds, registerLabel] = useIdRegistry();
  const [controlIds, registerControl] = useIdRegistry();
  const [helperTextIds, registerHelperText] = useIdRegistry();
  const [errorTextIds, registerErrorText] = useIdRegistry();

  // error が未指定のときは「エラーメッセージが描画されているか」をそのまま状態とみなす
  const hasError = error ?? errorTextIds.length > 0;
  // 補助テキスト → エラーメッセージの順に読み上げてほしいので、登録順ではなく種類の順で並べる
  const describedBy = [...helperTextIds, ...errorTextIds].join(' ') || undefined;
  // htmlFor / aria-labelledby に指定できる id は 1 つだけのため、最初に登録されたものを使う
  const labelledControlId = controlIds.length > 0 ? controlIds[0] : undefined;
  const labelId = labelIds.length > 0 ? labelIds[0] : undefined;

  // 入力要素と紐付けられないとき（複数のコントロールを並べたときなど）、ラベルは
  // for を持たないただの <label> になり支援技術から何とも結び付かない。
  // グループとして名前を持てるよう、このときだけルートを role="group" にする
  const isLabelledGroup = labelledControlId === undefined && labelId !== undefined;

  // context の値は全パーツの再レンダー要因になるため memo 化する。
  // register 系はいずれも参照が安定しているので、実質は状態と id の変化でのみ作り直される
  const contextValue = useMemo<FormFieldContextValue>(
    () => ({
      state: { required, requiredMark, disabled, error: hasError },
      actions: { registerLabel, registerControl, registerHelperText, registerErrorText },
      meta: { labelId, labelledControlId, describedBy },
    }),
    [
      required,
      requiredMark,
      disabled,
      hasError,
      registerLabel,
      registerControl,
      registerHelperText,
      registerErrorText,
      labelId,
      labelledControlId,
      describedBy,
    ]
  );

  return (
    <FormFieldContext value={contextValue}>
      {/* data 属性は状態と常に一致させたいので、利用側の props より後に指定する */}
      <div
        {...props}
        className={clsx(formField, className)}
        role={role ?? (isLabelledGroup ? 'group' : undefined)}
        aria-labelledby={ariaLabelledBy ?? (isLabelledGroup ? labelId : undefined)}
        data-orientation={orientation}
        // false は属性ごと出力しない。CSS は [data-error="true"] で拾うため、
        // false の出力は DOM のノイズにしかならない。
        // useFormFieldState が入力コンポーネントへ引き継ぐ値と同じ扱いに揃えている
        data-disabled={toTruthyOrUndefined(disabled)}
        data-error={toTruthyOrUndefined(hasError)}
      >
        {children}
      </div>
    </FormFieldContext>
  );
}

export type FormFieldLabelProps = Omit<ComponentPropsWithRef<'label'>, 'htmlFor' | 'id'>;

/**
 * フィールドのラベル。
 *
 * `htmlFor` は `FormField.Control` が描画した入力要素と自動で紐付くため受け付けない。
 * 紐付けられる入力要素が無いときは、代わりにルートがこのラベルで名前を持つ
 * （`role="group"` + `aria-labelledby`）。
 *
 * ルートの `required` に応じて必須マークも描画する
 */
const FormFieldLabel = ({ className, children, ...props }: FormFieldLabelProps) => {
  const {
    state,
    actions: { registerLabel },
    meta,
  } = useFormFieldContext();
  // id はインスタンスごとに採番する。context で共有すると複数描画時に DOM で id が重複する
  const labelId = useId();

  useEffect(() => registerLabel(labelId), [registerLabel, labelId]);

  const showAsterisk =
    state.required && (state.requiredMark === 'asterisk' || state.requiredMark === 'both');
  const showBadge =
    state.required && (state.requiredMark === 'badge' || state.requiredMark === 'both');

  return (
    // 紐付け先が描画されているときだけ htmlFor を出力する（存在しない id を指さないため）
    <label
      {...props}
      id={labelId}
      className={clsx(formFieldLabel, className)}
      htmlFor={meta.labelledControlId}
    >
      {children}
      {showAsterisk && (
        <span className={formFieldRequiredAsterisk} aria-hidden="true">
          *
        </span>
      )}
      {showBadge && <span className={formFieldRequiredBadge}>必須</span>}
    </label>
  );
};

export type FormFieldControlProps = ComponentPropsWithRef<'div'>;

/**
 * 入力欄（Input・Select など）を置く領域。
 *
 * 子が単一の要素のとき、`id` / `aria-describedby` / `aria-required` / `aria-invalid` /
 * `disabled` を自動で注入する。子が自身で指定している値は上書きしない
 * （`disabled` は、その属性を持てる素の HTML 要素とコンポーネントにのみ注入する）。
 *
 * 複数の入力要素を並べるときは注入されないため、`id` と `aria-required` は
 * 利用側で指定すること。エラー状態と `disabled` は context 経由で伝わるため指定は不要で、
 * ラベルは `FormField.Label` がグループ名として紐付く
 */
const FormFieldControl = ({ className, children, ...props }: FormFieldControlProps) => {
  const { state, actions, meta } = useFormFieldContext();

  const control = useFormFieldControl({
    children,
    describedBy: meta.describedBy,
    required: state.required,
    error: state.error,
    disabled: state.disabled,
    registerControl: actions.registerControl,
  });

  return (
    <div {...props} className={clsx(formFieldControl, className)}>
      {control}
    </div>
  );
};

export type FormFieldHelperTextProps = Omit<ComponentPropsWithRef<'p'>, 'id'>;

/**
 * 入力欄の下に表示する補助テキスト。
 * 描画すると入力要素の `aria-describedby` に自動で紐付く
 */
const FormFieldHelperText = ({ className, ...props }: FormFieldHelperTextProps) => {
  const {
    actions: { registerHelperText },
  } = useFormFieldContext();
  // id はインスタンスごとに採番する。context で共有すると複数描画時に DOM で id が重複する
  const helperTextId = useId();

  useEffect(() => registerHelperText(helperTextId), [registerHelperText, helperTextId]);

  return <p {...props} id={helperTextId} className={clsx(formFieldHelperText, className)} />;
};

export type FormFieldErrorTextProps = Omit<ComponentPropsWithRef<'p'>, 'id'>;

/**
 * 入力欄の下に表示するエラーメッセージ。
 *
 * 描画すると入力要素の `aria-describedby` に紐付き、フィールド全体がエラー状態になる
 * （ルートで `error` を明示している場合はそちらが優先される）
 */
// エラーは表示された時点で支援技術に通知する必要があるため、既定で role="alert" を付与する
const FormFieldErrorText = ({ className, role = 'alert', ...props }: FormFieldErrorTextProps) => {
  const {
    actions: { registerErrorText },
  } = useFormFieldContext();
  const errorTextId = useId();

  useEffect(() => registerErrorText(errorTextId), [registerErrorText, errorTextId]);

  return (
    <p {...props} id={errorTextId} role={role} className={clsx(formFieldErrorText, className)} />
  );
};

// compound components として合成できるようにルートへぶら下げる
FormField.Label = FormFieldLabel;
FormField.Control = FormFieldControl;
FormField.HelperText = FormFieldHelperText;
FormField.ErrorText = FormFieldErrorText;
