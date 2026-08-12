import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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

  it('startIcon / endIcon に 0 を渡してもアイコン要素を描画しない', () => {
    const { container } = render(<Input startIcon={0} endIcon={0} placeholder="falsy" />);

    expect(container.querySelector('[data-position="start"]')).toBeNull();
    expect(container.querySelector('[data-position="end"]')).toBeNull();
    // && だと 0 がそのままテキストとして描画されてしまう
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('ネイティブ属性とイベントを input に渡す', () => {
    render(<Input type="email" name="mail" placeholder="native" />);

    const field = screen.getByPlaceholderText('native');

    expect(field).toHaveAttribute('type', 'email');
    expect(field).toHaveAttribute('name', 'mail');
  });
});
