import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FormField } from '../FormField';

import { Radio } from './Radio';

describe('Radio', () => {
  it('ラベルがアクセシブルな名前になる', () => {
    render(<Radio>りんご</Radio>);

    expect(screen.getByRole('radio', { name: 'りんご' })).toBeInTheDocument();
  });

  it('デフォルトは未選択である', () => {
    render(<Radio>label</Radio>);

    expect(screen.getByRole('radio')).not.toBeChecked();
  });

  it('クリックで選択状態になる', () => {
    render(<Radio>label</Radio>);

    const radio = screen.getByRole('radio');
    fireEvent.click(radio);

    expect(radio).toBeChecked();
  });

  it('onChange が呼ばれる', () => {
    const handleChange = vi.fn();
    render(<Radio onChange={handleChange}>label</Radio>);

    fireEvent.click(screen.getByRole('radio'));

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('defaultChecked のとき選択済みで描画される', () => {
    render(<Radio defaultChecked>label</Radio>);

    expect(screen.getByRole('radio')).toBeChecked();
  });

  it('disabled のとき input が無効化され data-disabled が付与される', () => {
    render(<Radio disabled>label</Radio>);

    const radio = screen.getByRole('radio');

    expect(radio).toBeDisabled();
    expect(radio.closest('label')).toHaveAttribute('data-disabled', 'true');
  });

  it('同じ name のラジオは排他選択になる', () => {
    render(
      <>
        <Radio name="fruit" value="apple">
          りんご
        </Radio>
        <Radio name="fruit" value="orange">
          みかん
        </Radio>
      </>
    );

    const apple = screen.getByRole('radio', { name: 'りんご' });
    const orange = screen.getByRole('radio', { name: 'みかん' });

    fireEvent.click(apple);
    expect(apple).toBeChecked();

    fireEvent.click(orange);
    expect(orange).toBeChecked();
    expect(apple).not.toBeChecked();
  });

  it('ラベルなしでも aria-label でアクセシブルな名前を持てる', () => {
    render(<Radio aria-label="単独ラジオ" />);

    expect(screen.getByRole('radio', { name: '単独ラジオ' })).toBeInTheDocument();
  });

  it('ネイティブ属性を input に渡す', () => {
    render(<Radio name="fruit" value="apple" />);

    const radio = screen.getByRole('radio');

    expect(radio).toHaveAttribute('name', 'fruit');
    expect(radio).toHaveAttribute('value', 'apple');
  });

  it('ref を input に転送する', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Radio ref={ref}>りんご</Radio>);

    expect(ref.current).toBe(screen.getByRole('radio'));
  });

  describe('FormField との連携', () => {
    it('FormField の disabled を引き継ぐ', () => {
      render(
        <FormField disabled>
          <Radio>りんご</Radio>
        </FormField>
      );

      expect(screen.getByRole('radio')).toBeDisabled();
    });

    it('自身に指定した値を優先する', () => {
      render(
        <FormField disabled>
          <Radio disabled={false}>りんご</Radio>
        </FormField>
      );

      expect(screen.getByRole('radio')).toBeEnabled();
    });
  });
});
