import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useFormFieldControl } from './useFormFieldControl';

type ControlProps = {
  children: ReactNode;
  controlId?: string;
  describedBy?: string;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  registerControl?: (id: string) => () => void;
};

const Control = ({
  children,
  controlId = 'generated-id',
  describedBy,
  required = false,
  error = false,
  disabled = false,
  registerControl = () => () => {},
}: ControlProps) => (
  <>
    {useFormFieldControl({
      children,
      controlId,
      describedBy,
      required,
      error,
      disabled,
      registerControl,
    })}
  </>
);

describe('useFormFieldControl', () => {
  it('単一の要素に id を注入する', () => {
    render(
      <Control>
        <input aria-label="入力" />
      </Control>
    );

    expect(screen.getByLabelText('入力')).toHaveAttribute('id', 'generated-id');
  });

  it('要素が自前の id を持つときはそちらを尊重する', () => {
    render(
      <Control>
        <input aria-label="入力" id="own-id" />
      </Control>
    );

    expect(screen.getByLabelText('入力')).toHaveAttribute('id', 'own-id');
  });

  it('注入した id をルートへ登録し、描画されなくなったら解除する', () => {
    const unregister = vi.fn();
    const registerControl = vi.fn(() => unregister);

    const { unmount } = render(
      <Control registerControl={registerControl}>
        <input aria-label="入力" />
      </Control>
    );

    expect(registerControl).toHaveBeenCalledWith('generated-id');

    unmount();

    expect(unregister).toHaveBeenCalledTimes(1);
  });

  it('説明テキストの id を aria-describedby に反映する', () => {
    render(
      <Control describedBy="helper-id error-id">
        <input aria-label="入力" />
      </Control>
    );

    expect(screen.getByLabelText('入力')).toHaveAttribute('aria-describedby', 'helper-id error-id');
  });

  it('要素が指定している aria-describedby を残して結合する', () => {
    render(
      <Control describedBy="helper-id">
        <input aria-label="入力" aria-describedby="own-id" />
      </Control>
    );

    expect(screen.getByLabelText('入力')).toHaveAttribute('aria-describedby', 'own-id helper-id');
  });

  it('required / error / disabled を属性として注入する', () => {
    render(
      <Control required error disabled>
        <input aria-label="入力" />
      </Control>
    );

    const control = screen.getByLabelText('入力');
    expect(control).toHaveAttribute('aria-required', 'true');
    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control).toBeDisabled();
  });

  it('状態が false のときは属性を出力しない', () => {
    render(
      <Control>
        <input aria-label="入力" />
      </Control>
    );

    const control = screen.getByLabelText('入力');
    expect(control).not.toHaveAttribute('aria-required');
    expect(control).not.toHaveAttribute('aria-invalid');
    expect(control).toBeEnabled();
  });

  it('要素が指定している値を上書きしない', () => {
    render(
      <Control required error disabled>
        <input aria-label="入力" aria-required={false} aria-invalid={false} disabled={false} />
      </Control>
    );

    const control = screen.getByLabelText('入力');
    expect(control).toHaveAttribute('aria-required', 'false');
    expect(control).toHaveAttribute('aria-invalid', 'false');
    expect(control).toBeEnabled();
  });

  it('子が複数要素のときは注入も登録もしない', () => {
    const registerControl = vi.fn(() => () => {});

    render(
      <Control registerControl={registerControl} disabled>
        <input aria-label="姓" />
        <input aria-label="名" />
      </Control>
    );

    expect(screen.getByLabelText('姓')).not.toHaveAttribute('id');
    expect(screen.getByLabelText('姓')).toBeEnabled();
    expect(screen.getByLabelText('名')).not.toHaveAttribute('id');
    expect(registerControl).not.toHaveBeenCalled();
  });

  it('子が単一の Fragment のときは注入しない（props を受け取れないため）', () => {
    render(
      <Control>
        <>
          <input aria-label="入力" />
        </>
      </Control>
    );

    expect(screen.getByLabelText('入力')).not.toHaveAttribute('id');
  });

  it('子がテキストのときはそのまま描画する', () => {
    render(<Control>テキスト</Control>);

    expect(screen.getByText('テキスト')).toBeInTheDocument();
  });
});
