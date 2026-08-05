import { renderHook } from '@testing-library/react';
import { isValidElement } from 'react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';

import { useFormField } from './useFormField';

type ControlProps = {
  id?: string;
  'aria-describedby'?: string;
  'aria-required'?: boolean;
};

type Params = Parameters<typeof useFormField>[0];

const defaultParams: Params = {
  required: false,
  hasHelperText: false,
  hasErrorText: false,
  children: <input />,
};

const renderUseFormField = (params: Partial<Params> = {}) =>
  renderHook(() => useFormField({ ...defaultParams, ...params })).result.current;

/**
 * 注入結果を確認するために、返された入力要素の props を取り出す
 */
const getControlProps = (control: ReactNode): ControlProps => {
  if (!isValidElement<ControlProps>(control)) {
    throw new Error('control is not an element');
  }

  return control.props;
};

describe('useFormField', () => {
  it('補助テキストとエラーメッセージの id を返す', () => {
    const { helperTextId, errorTextId } = renderUseFormField();

    expect(helperTextId).not.toBe('');
    expect(errorTextId).not.toBe('');
    expect(helperTextId).not.toBe(errorTextId);
  });

  it('単一要素のとき id を生成して入力要素に注入する', () => {
    const { controlId, control } = renderUseFormField();

    expect(controlId).not.toBeUndefined();
    expect(getControlProps(control).id).toBe(controlId);
  });

  it('htmlFor を最優先する', () => {
    const { controlId, control } = renderUseFormField({
      htmlFor: 'name',
      children: <input id="custom-id" />,
    });

    expect(controlId).toBe('name');
    expect(getControlProps(control).id).toBe('name');
  });

  it('htmlFor 未指定のとき入力要素の id を使う', () => {
    const { controlId, control } = renderUseFormField({ children: <input id="custom-id" /> });

    expect(controlId).toBe('custom-id');
    expect(getControlProps(control).id).toBe('custom-id');
  });

  it('補助テキストとエラーメッセージの id を aria-describedby に並べる', () => {
    const { helperTextId, errorTextId, control } = renderUseFormField({
      hasHelperText: true,
      hasErrorText: true,
    });

    expect(getControlProps(control)['aria-describedby']).toBe(`${helperTextId} ${errorTextId}`);
  });

  it('表示するテキストの id だけを aria-describedby に含める', () => {
    const helperOnly = renderUseFormField({ hasHelperText: true });
    expect(getControlProps(helperOnly.control)['aria-describedby']).toBe(helperOnly.helperTextId);

    const errorOnly = renderUseFormField({ hasErrorText: true });
    expect(getControlProps(errorOnly.control)['aria-describedby']).toBe(errorOnly.errorTextId);
  });

  it('補助テキストもエラーメッセージもないとき aria-describedby を付与しない', () => {
    const { control } = renderUseFormField();

    expect(getControlProps(control)['aria-describedby']).toBeUndefined();
  });

  it('入力要素が指定している aria-describedby を先頭に残して結合する', () => {
    const { helperTextId, control } = renderUseFormField({
      hasHelperText: true,
      children: <input aria-describedby="external-description" />,
    });

    expect(getControlProps(control)['aria-describedby']).toBe(
      `external-description ${helperTextId}`
    );
  });

  it('入力要素の aria-describedby が空文字のときは結合しない', () => {
    const { helperTextId, control } = renderUseFormField({
      hasHelperText: true,
      children: <input aria-describedby="" />,
    });

    expect(getControlProps(control)['aria-describedby']).toBe(helperTextId);
  });

  it('required のとき aria-required を付与する', () => {
    const { control } = renderUseFormField({ required: true });

    expect(getControlProps(control)['aria-required']).toBe(true);
  });

  it('required でないとき aria-required を付与しない', () => {
    const { control } = renderUseFormField();

    expect(getControlProps(control)['aria-required']).toBeUndefined();
  });

  it('入力要素が指定している aria-required を優先する', () => {
    const { control } = renderUseFormField({
      required: true,
      children: <input aria-required={false} />,
    });

    expect(getControlProps(control)['aria-required']).toBe(false);
  });

  it('children が複数要素のときは注入せず controlId も生成しない', () => {
    const children = (
      <>
        <input aria-label="姓" />
        <input aria-label="名" />
      </>
    ).props.children;
    const { controlId, control } = renderUseFormField({ hasHelperText: true, children });

    expect(controlId).toBeUndefined();
    expect(control).toBe(children);
  });

  it('children がテキストのときは注入せず controlId も生成しない', () => {
    const { controlId, control } = renderUseFormField({ children: 'テキスト' });

    expect(controlId).toBeUndefined();
    expect(control).toBe('テキスト');
  });

  it('children が単一の Fragment のときは注入しない', () => {
    const children = (
      <>
        <input />
      </>
    );
    const { controlId, control } = renderUseFormField({ hasHelperText: true, children });

    expect(controlId).toBeUndefined();
    expect(control).toBe(children);
  });

  it('注入先がなくても htmlFor はそのまま controlId として返す', () => {
    const { controlId, control } = renderUseFormField({ htmlFor: 'name', children: 'テキスト' });

    expect(controlId).toBe('name');
    expect(control).toBe('テキスト');
  });
});
