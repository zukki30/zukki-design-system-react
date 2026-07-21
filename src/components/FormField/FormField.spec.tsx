import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { FormField } from './FormField';

describe('FormField', () => {
  it('label と children を描画する', () => {
    render(
      <FormField label="ラベル">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('ラベル')).toBeInTheDocument();
    expect(screen.getByLabelText('入力')).toBeInTheDocument();
  });

  it('label が未指定のときラベルを描画しない', () => {
    render(
      <FormField>
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.queryByText('ラベル')).not.toBeInTheDocument();
  });

  it('htmlFor で label と入力要素を紐付ける', () => {
    render(
      <FormField label="名前" htmlFor="name">
        <input id="name" />
      </FormField>,
    );

    expect(screen.getByLabelText('名前')).toHaveAttribute('id', 'name');
  });

  it('orientation を data 属性に反映する（デフォルト horizontal）', () => {
    const { rerender } = render(
      <FormField label="ラベル">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('ラベル').closest('[data-orientation]')).toHaveAttribute(
      'data-orientation',
      'horizontal',
    );

    rerender(
      <FormField label="ラベル" orientation="vertical">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('ラベル').closest('[data-orientation]')).toHaveAttribute(
      'data-orientation',
      'vertical',
    );
  });

  it('required が false のとき必須マークを描画しない', () => {
    render(
      <FormField label="ラベル">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.queryByText('必須')).not.toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('requiredMark="badge" のとき必須バッジのみ描画する', () => {
    render(
      <FormField label="ラベル" required requiredMark="badge">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('必須')).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('requiredMark="asterisk" のときアスタリスクのみ描画する', () => {
    render(
      <FormField label="ラベル" required requiredMark="asterisk">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.queryByText('必須')).not.toBeInTheDocument();
  });

  it('requiredMark="both" のとき両方の必須マークを描画する', () => {
    render(
      <FormField label="ラベル" required requiredMark="both">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('必須')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('requiredMark のデフォルトはバッジ表示', () => {
    render(
      <FormField label="ラベル" required>
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('必須')).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('disabled のとき data-disabled が付与される', () => {
    render(
      <FormField label="ラベル" disabled>
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('ラベル').closest('[data-disabled]')).toHaveAttribute(
      'data-disabled',
      'true',
    );
  });

  it('helperText を描画する', () => {
    render(
      <FormField label="ラベル" helperText="補助テキスト">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('補助テキスト')).toBeInTheDocument();
  });

  it('errorText を描画する', () => {
    render(
      <FormField label="ラベル" errorText="エラーメッセージ">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
  });

  it('helperText と errorText が未指定のとき描画しない', () => {
    render(
      <FormField label="ラベル">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.queryByText('補助テキスト')).not.toBeInTheDocument();
    expect(screen.queryByText('エラーメッセージ')).not.toBeInTheDocument();
  });

  it('ネイティブ属性を div に渡す', () => {
    render(
      <FormField label="ラベル" data-testid="field">
        <input aria-label="入力" />
      </FormField>,
    );

    expect(screen.getByTestId('field')).toBeInTheDocument();
  });
});
