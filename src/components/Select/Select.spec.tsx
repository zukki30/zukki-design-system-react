import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Select } from './Select';

const options = (
  <>
    <option value="apple">りんご</option>
    <option value="orange">みかん</option>
  </>
);

describe('Select', () => {
  it('option を描画する', () => {
    render(<Select>{options}</Select>);

    expect(screen.getByRole('option', { name: 'りんご' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'みかん' })).toBeInTheDocument();
  });

  it('placeholder option を描画し初期選択にする', () => {
    render(<Select placeholder="選択してください">{options}</Select>);

    expect(screen.getByRole('combobox')).toHaveValue('');
    expect(screen.getByText('選択してください')).toBeInTheDocument();
  });

  it('選択を変更できる', () => {
    render(<Select placeholder="選択してください">{options}</Select>);

    const combobox = screen.getByRole('combobox');
    fireEvent.change(combobox, { target: { value: 'orange' } });

    expect(combobox).toHaveValue('orange');
  });

  it('onChange が呼ばれる', () => {
    const handleChange = vi.fn();
    render(
      <Select onChange={handleChange} placeholder="選択してください">
        {options}
      </Select>,
    );

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'apple' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('defaultValue で初期値を指定できる', () => {
    render(
      <Select defaultValue="orange" placeholder="選択してください">
        {options}
      </Select>,
    );

    expect(screen.getByRole('combobox')).toHaveValue('orange');
  });

  it('disabled のとき select が無効化され data-disabled が付与される', () => {
    render(<Select disabled>{options}</Select>);

    const combobox = screen.getByRole('combobox');

    expect(combobox).toBeDisabled();
    expect(combobox.closest('div')).toHaveAttribute('data-disabled', 'true');
  });

  it('error のとき data-error と aria-invalid が付与される', () => {
    render(<Select error>{options}</Select>);

    const combobox = screen.getByRole('combobox');

    expect(combobox).toHaveAttribute('aria-invalid', 'true');
    expect(combobox.closest('div')).toHaveAttribute('data-error', 'true');
  });

  it('ネイティブ属性を select に渡す', () => {
    render(
      <Select name="fruit" required>
        {options}
      </Select>,
    );

    const combobox = screen.getByRole('combobox');

    expect(combobox).toHaveAttribute('name', 'fruit');
    expect(combobox).toBeRequired();
  });
});
