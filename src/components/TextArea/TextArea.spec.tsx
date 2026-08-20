import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { FormField } from '../FormField';

import { TextArea } from './TextArea';

describe('TextArea', () => {
  it('placeholder を表示する', () => {
    render(<TextArea placeholder="placeholder" />);

    expect(screen.getByPlaceholderText('placeholder')).toBeInTheDocument();
  });

  it('value を表示する', () => {
    render(<TextArea defaultValue="サンプルテキスト" />);

    expect(screen.getByDisplayValue('サンプルテキスト')).toBeInTheDocument();
  });

  it('disabled のとき textarea が無効化される', () => {
    render(<TextArea disabled placeholder="disabled" />);

    expect(screen.getByPlaceholderText('disabled')).toBeDisabled();
  });

  it('error のとき data-error と aria-invalid が付与される', () => {
    render(<TextArea error placeholder="error" />);

    const field = screen.getByPlaceholderText('error');

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field).toHaveAttribute('data-error', 'true');
  });

  it('error 未指定のとき aria-invalid は付与されない', () => {
    render(<TextArea placeholder="no-error" />);

    expect(screen.getByPlaceholderText('no-error')).not.toHaveAttribute('aria-invalid');
  });

  it('ネイティブ属性を textarea に渡す', () => {
    render(<TextArea name="message" rows={5} placeholder="native" />);

    const field = screen.getByPlaceholderText('native');

    expect(field).toHaveAttribute('name', 'message');
    expect(field).toHaveAttribute('rows', '5');
  });

  it('className を結合して付与する', () => {
    render(<TextArea className="custom-class" placeholder="custom" />);

    expect(screen.getByPlaceholderText('custom')).toHaveClass('custom-class');
  });

  it('ref を textarea に転送する', () => {
    const ref = createRef<HTMLTextAreaElement>();
    render(<TextArea ref={ref} placeholder="ref" />);

    expect(ref.current).toBe(screen.getByPlaceholderText('ref'));
  });

  describe('FormField との連携', () => {
    it('FormField のエラー状態と disabled を引き継ぐ', () => {
      render(
        <FormField error disabled>
          <TextArea placeholder="textarea" />
        </FormField>
      );

      const textarea = screen.getByPlaceholderText('textarea');
      expect(textarea).toHaveAttribute('aria-invalid', 'true');
      expect(textarea).toHaveAttribute('data-error', 'true');
      expect(textarea).toBeDisabled();
    });

    it('自身に指定した値を優先する', () => {
      render(
        <FormField error disabled>
          <TextArea placeholder="textarea" error={false} disabled={false} />
        </FormField>
      );

      const textarea = screen.getByPlaceholderText('textarea');
      expect(textarea).toHaveAttribute('aria-invalid', 'false');
      expect(textarea).toBeEnabled();
    });
  });
});
