import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FormField } from '../FormField';

import { Switch } from './Switch';

describe('Switch', () => {
  it('ラベルがアクセシブルな名前になる', () => {
    render(<Switch>通知を受け取る</Switch>);

    expect(screen.getByRole('switch', { name: '通知を受け取る' })).toBeInTheDocument();
  });

  it('ラベルに 0 を渡してもテキストとして描画する', () => {
    render(<Switch>{0}</Switch>);

    expect(screen.getByRole('switch')).toHaveAccessibleName('0');
  });

  it.each([
    { name: 'undefined', children: undefined },
    // {cond && label} が偽のときに渡る値。空の span が残ると gap だけが空いてしまう
    { name: 'false', children: false },
  ])('ラベルが $name のときラベル要素ごと描画しない', ({ children }) => {
    render(<Switch aria-label="通知を受け取る">{children}</Switch>);

    // 子要素はスイッチ本体だけになる
    expect(screen.getByRole('switch').closest('label')?.childElementCount).toBe(1);
  });

  it('switch ロールを持つ', () => {
    render(<Switch>label</Switch>);

    expect(screen.getByRole('switch')).toBeInTheDocument();
  });

  it('デフォルトはオフである', () => {
    render(<Switch>label</Switch>);

    expect(screen.getByRole('switch')).not.toBeChecked();
  });

  it('クリックでオン・オフが切り替わる', () => {
    render(<Switch>label</Switch>);

    const switchEl = screen.getByRole('switch');
    fireEvent.click(switchEl);

    expect(switchEl).toBeChecked();
  });

  it('onChange が呼ばれる', () => {
    const handleChange = vi.fn();
    render(<Switch onChange={handleChange}>label</Switch>);

    fireEvent.click(screen.getByRole('switch'));

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('defaultChecked のときオンで描画される', () => {
    render(<Switch defaultChecked>label</Switch>);

    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('disabled のとき input が無効化され data-disabled が付与される', () => {
    render(<Switch disabled>label</Switch>);

    const switchEl = screen.getByRole('switch');

    expect(switchEl).toBeDisabled();
    expect(switchEl.closest('label')).toHaveAttribute('data-disabled', 'true');
  });

  it('ラベルなしでも aria-label でアクセシブルな名前を持てる', () => {
    render(<Switch aria-label="単独スイッチ" />);

    expect(screen.getByRole('switch', { name: '単独スイッチ' })).toBeInTheDocument();
  });

  it('ネイティブ属性を input に渡す', () => {
    render(<Switch name="notify" value="on" />);

    const switchEl = screen.getByRole('switch');

    expect(switchEl).toHaveAttribute('name', 'notify');
    expect(switchEl).toHaveAttribute('value', 'on');
  });

  it('ref を input に転送する', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Switch ref={ref}>通知を受け取る</Switch>);

    expect(ref.current).toBe(screen.getByRole('switch'));
  });

  describe('size', () => {
    // [data-size] で辿ると FormField のルートまで登ってしまい、
    // Switch 自身が属性を出さなくなっても通ってしまう
    const root = () => screen.getByRole('switch').closest('label');

    it('既定は md', () => {
      render(<Switch>通知を受け取る</Switch>);

      expect(root()).toHaveAttribute('data-size', 'md');
    });

    it('指定した size を data 属性に反映する', () => {
      render(<Switch size="sm">通知を受け取る</Switch>);

      expect(root()).toHaveAttribute('data-size', 'sm');
    });

    it('FormField の size を引き継ぐ', () => {
      render(
        <FormField size="sm">
          <Switch>通知を受け取る</Switch>
        </FormField>
      );

      expect(root()).toHaveAttribute('data-size', 'sm');
    });

    it('自身に指定した size を FormField より優先する', () => {
      render(
        <FormField size="sm">
          <Switch size="md">通知を受け取る</Switch>
        </FormField>
      );

      expect(root()).toHaveAttribute('data-size', 'md');
    });
  });

  describe('FormField との連携', () => {
    it('FormField の disabled を引き継ぐ', () => {
      render(
        <FormField disabled>
          <Switch>通知を受け取る</Switch>
        </FormField>
      );

      expect(screen.getByRole('switch')).toBeDisabled();
    });

    it('自身に指定した値を優先する', () => {
      render(
        <FormField disabled>
          <Switch disabled={false}>通知を受け取る</Switch>
        </FormField>
      );

      expect(screen.getByRole('switch')).toBeEnabled();
    });
  });
});
