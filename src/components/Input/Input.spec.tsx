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

  it('startIcon を表示する', () => {
    render(<Input startIcon={<span data-testid="start-icon" />} placeholder="start" />);

    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
  });

  it('endIcon を表示する', () => {
    render(<Input endIcon={<span data-testid="end-icon" />} placeholder="end" />);

    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
  });

  it('startIcon / endIcon を渡さないときアイコン要素を描画しない', () => {
    render(<Input placeholder="no-icon" />);

    expect(screen.queryByTestId('start-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('end-icon')).not.toBeInTheDocument();
  });

  it('ネイティブ属性とイベントを input に渡す', () => {
    render(<Input type="email" name="mail" placeholder="native" />);

    const field = screen.getByPlaceholderText('native');

    expect(field).toHaveAttribute('type', 'email');
    expect(field).toHaveAttribute('name', 'mail');
  });
});
