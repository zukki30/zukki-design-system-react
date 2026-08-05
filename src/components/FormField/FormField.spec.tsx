import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '../Input';

import { FormField } from './FormField';

describe('FormField', () => {
  it('label と children を描画する', () => {
    render(
      <FormField label="ラベル">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('ラベル')).toBeInTheDocument();
    expect(screen.getByLabelText('入力')).toBeInTheDocument();
  });

  it('label が未指定のときラベルを描画しない', () => {
    render(
      <FormField>
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.queryByText('ラベル')).not.toBeInTheDocument();
  });

  it('htmlFor で label と入力要素を紐付ける', () => {
    render(
      <FormField label="名前" htmlFor="name">
        <input id="name" />
      </FormField>
    );

    expect(screen.getByLabelText('名前')).toHaveAttribute('id', 'name');
  });

  it('orientation を data 属性に反映する（デフォルト horizontal）', () => {
    const { rerender } = render(
      <FormField label="ラベル">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('ラベル').closest('[data-orientation]')).toHaveAttribute(
      'data-orientation',
      'horizontal'
    );

    rerender(
      <FormField label="ラベル" orientation="vertical">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('ラベル').closest('[data-orientation]')).toHaveAttribute(
      'data-orientation',
      'vertical'
    );
  });

  it('required が false のとき必須マークを描画しない', () => {
    render(
      <FormField label="ラベル">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.queryByText('必須')).not.toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('requiredMark="badge" のとき必須バッジのみ描画する', () => {
    render(
      <FormField label="ラベル" required requiredMark="badge">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('必須')).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('requiredMark="asterisk" のときアスタリスクのみ描画する', () => {
    render(
      <FormField label="ラベル" required requiredMark="asterisk">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('*')).toBeInTheDocument();
    expect(screen.queryByText('必須')).not.toBeInTheDocument();
  });

  it('requiredMark="both" のとき両方の必須マークを描画する', () => {
    render(
      <FormField label="ラベル" required requiredMark="both">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('必須')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('requiredMark のデフォルトはバッジ表示', () => {
    render(
      <FormField label="ラベル" required>
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('必須')).toBeInTheDocument();
    expect(screen.queryByText('*')).not.toBeInTheDocument();
  });

  it('disabled のとき data-disabled が付与される', () => {
    render(
      <FormField label="ラベル" disabled>
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('ラベル').closest('[data-disabled]')).toHaveAttribute(
      'data-disabled',
      'true'
    );
  });

  it('helperText を描画する', () => {
    render(
      <FormField label="ラベル" helperText="補助テキスト">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('補助テキスト')).toBeInTheDocument();
  });

  it('errorText を描画する', () => {
    render(
      <FormField label="ラベル" errorText="エラーメッセージ">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByText('エラーメッセージ')).toBeInTheDocument();
  });

  it('helperText と errorText が未指定のとき描画しない', () => {
    render(
      <FormField label="ラベル">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.queryByText('補助テキスト')).not.toBeInTheDocument();
    expect(screen.queryByText('エラーメッセージ')).not.toBeInTheDocument();
  });

  it('htmlFor 未指定でも label と入力要素を紐付ける', () => {
    render(
      <FormField label="名前">
        <input />
      </FormField>
    );

    // 紐付いていなければ getByLabelText が失敗する
    expect(screen.getByLabelText('名前')).toHaveAttribute('id');
  });

  it('htmlFor 未指定のとき children の id を優先する', () => {
    render(
      <FormField label="名前">
        <input id="custom-id" />
      </FormField>
    );

    expect(screen.getByLabelText('名前')).toHaveAttribute('id', 'custom-id');
  });

  it('htmlFor 指定時は children に id を注入する', () => {
    render(
      <FormField label="名前" htmlFor="name">
        <input id="custom-id" />
      </FormField>
    );

    expect(screen.getByLabelText('名前')).toHaveAttribute('id', 'name');
  });

  it('children が単一要素でないときは id を注入せず label も紐付けない', () => {
    render(
      <FormField label="名前" helperText="補助テキスト">
        <input aria-label="姓" />
        <input aria-label="名" />
      </FormField>
    );

    expect(screen.getByLabelText('姓')).not.toHaveAttribute('id');
    expect(screen.getByLabelText('姓')).not.toHaveAttribute('aria-describedby');
    expect(screen.getByLabelText('名')).not.toHaveAttribute('id');
    // 存在しない id を指す label を出力しない
    expect(screen.getByText('名前')).not.toHaveAttribute('for');
  });

  it('children が単一要素でなくても htmlFor は label に反映する', () => {
    render(
      <FormField label="名前" htmlFor="last-name">
        <input aria-label="姓" id="last-name" />
        <input aria-label="名" />
      </FormField>
    );

    expect(screen.getByText('名前')).toHaveAttribute('for', 'last-name');
    expect(screen.getByLabelText('名')).not.toHaveAttribute('id');
  });

  it('children が単一の Fragment のときは注入しない', () => {
    render(
      <FormField label="名前" helperText="補助テキスト">
        <>
          <input aria-label="入力" />
        </>
      </FormField>
    );

    expect(screen.getByLabelText('入力')).not.toHaveAttribute('id');
    expect(screen.getByLabelText('入力')).not.toHaveAttribute('aria-describedby');
    expect(screen.getByText('名前')).not.toHaveAttribute('for');
  });

  it('Input のようなラッパーコンポーネントにも配線が届く', () => {
    render(
      <FormField label="名前" required helperText="全角で入力してください">
        <Input />
      </FormField>
    );

    const control = screen.getByRole('textbox');
    expect(control).toHaveAttribute('aria-required', 'true');
    expect(control).toHaveAccessibleDescription('全角で入力してください');
    expect(screen.getByText('名前').closest('label')).toHaveAttribute(
      'for',
      control.getAttribute('id')
    );
  });

  it('children がテキストのときもそのまま描画する', () => {
    render(<FormField label="名前">テキスト</FormField>);

    expect(screen.getByText('テキスト')).toBeInTheDocument();
  });

  it('helperText を aria-describedby で入力要素に紐付ける', () => {
    render(
      <FormField label="名前" helperText="全角で入力してください">
        <input />
      </FormField>
    );

    expect(screen.getByLabelText('名前')).toHaveAccessibleDescription('全角で入力してください');
  });

  it('errorText を aria-describedby で紐付け、role="alert" で通知する', () => {
    render(
      <FormField label="名前" errorText="必須項目です">
        <input />
      </FormField>
    );

    expect(screen.getByLabelText('名前')).toHaveAccessibleDescription('必須項目です');
    expect(screen.getByRole('alert')).toHaveTextContent('必須項目です');
  });

  it('helperText と errorText の両方を aria-describedby に含める', () => {
    render(
      <FormField label="名前" helperText="全角で入力してください" errorText="必須項目です">
        <input />
      </FormField>
    );

    expect(screen.getByLabelText('名前')).toHaveAccessibleDescription(
      '全角で入力してください 必須項目です'
    );
  });

  it('children 側の aria-describedby を残して結合する', () => {
    render(
      <>
        <FormField label="名前" helperText="全角で入力してください">
          <input aria-describedby="external-description" />
        </FormField>
        <p id="external-description">外部の説明</p>
      </>
    );

    expect(screen.getByLabelText('名前')).toHaveAccessibleDescription(
      '外部の説明 全角で入力してください'
    );
  });

  it('helperText と errorText が未指定のとき aria-describedby を付与しない', () => {
    render(
      <FormField label="名前">
        <input />
      </FormField>
    );

    expect(screen.getByLabelText('名前')).not.toHaveAttribute('aria-describedby');
  });

  it('required のとき aria-required を伝播する', () => {
    render(
      <FormField label="名前" required>
        <input />
      </FormField>
    );

    // 必須バッジのぶんラベルのテキストが増えるため role で取得する
    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
  });

  it('required でないとき aria-required を付与しない', () => {
    render(
      <FormField label="名前">
        <input />
      </FormField>
    );

    expect(screen.getByLabelText('名前')).not.toHaveAttribute('aria-required');
  });

  it('children 側の aria-required を優先する', () => {
    render(
      <FormField label="名前" required>
        <input aria-required={false} />
      </FormField>
    );

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'false');
  });

  it('ネイティブ属性を div に渡す', () => {
    render(
      <FormField label="ラベル" data-testid="field">
        <input aria-label="入力" />
      </FormField>
    );

    expect(screen.getByTestId('field')).toBeInTheDocument();
  });
});
