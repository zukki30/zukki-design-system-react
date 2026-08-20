import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { FormField } from '../FormField';

import { Input } from './Input';

describe('Input', () => {
  it('placeholder を表示する', () => {
    render(<Input placeholder="placeholder" />);

    expect(screen.getByPlaceholderText('placeholder')).toBeInTheDocument();
  });

  it('value を表示する', () => {
    render(<Input defaultValue="サンプルテキスト" />);

    expect(screen.getByDisplayValue('サンプルテキスト')).toBeInTheDocument();
  });

  it('disabled のとき input が無効化され data-disabled が付与される', () => {
    render(<Input disabled placeholder="disabled" />);

    const field = screen.getByPlaceholderText('disabled');

    expect(field).toBeDisabled();
    expect(field.parentElement).toHaveAttribute('data-disabled', 'true');
  });

  it('error のとき data-error と aria-invalid が付与される', () => {
    render(<Input error placeholder="error" />);

    const field = screen.getByPlaceholderText('error');

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.parentElement).toHaveAttribute('data-error', 'true');
  });

  it('startIcon を装飾として表示する', () => {
    render(<Input startIcon={<span data-testid="start-icon" />} placeholder="start" />);

    const icon = screen.getByTestId('start-icon');

    expect(icon).toBeInTheDocument();
    // 装飾なので支援技術からは隠す
    expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('endIcon を装飾として表示する', () => {
    render(<Input endIcon={<span data-testid="end-icon" />} placeholder="end" />);

    const icon = screen.getByTestId('end-icon');

    expect(icon).toBeInTheDocument();
    expect(icon.parentElement).toHaveAttribute('aria-hidden', 'true');
  });

  it('startIcon / endIcon を渡さないときアイコン要素を描画しない', () => {
    render(<Input placeholder="no-icon" />);

    expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
  });

  it.each([0, '', false, NaN])(
    'startIcon / endIcon に falsy な値（%s）を渡してもアイコンを描画しない',
    (icon) => {
      render(<Input startIcon={icon} endIcon={icon} placeholder="falsy" />);

      const wrapper = screen.getByPlaceholderText('falsy').parentElement;

      // && だと 0 や NaN がそのままテキストとして描画されてしまう
      expect(wrapper?.textContent).toBe('');
      // アイコン用の span も描画されないため、子要素は input だけ
      expect(wrapper?.childElementCount).toBe(1);
    }
  );

  it('ネイティブ属性とイベントを input に渡す', () => {
    render(<Input type="email" name="mail" placeholder="native" />);

    const field = screen.getByPlaceholderText('native');

    expect(field).toHaveAttribute('type', 'email');
    expect(field).toHaveAttribute('name', 'mail');
  });

  it('ref を input に転送する', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="ref" />);

    expect(ref.current).toBe(screen.getByPlaceholderText('ref'));
  });

  it('転送された ref からフォーカスできる', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="focus" />);

    ref.current?.focus();

    expect(screen.getByPlaceholderText('focus')).toHaveFocus();
  });

  describe('FormField との連携', () => {
    it('FormField のエラー状態と disabled を引き継ぐ', () => {
      render(
        <FormField error disabled>
          <Input placeholder="input" />
        </FormField>
      );

      const input = screen.getByPlaceholderText('input');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toBeDisabled();
      expect(input.closest('[data-error]')).toHaveAttribute('data-error', 'true');
    });

    it('自身に指定した値を優先する', () => {
      render(
        <FormField error disabled>
          <Input placeholder="input" error={false} disabled={false} />
        </FormField>
      );

      const input = screen.getByPlaceholderText('input');
      expect(input).toHaveAttribute('aria-invalid', 'false');
      expect(input).toBeEnabled();
    });
  });
});
