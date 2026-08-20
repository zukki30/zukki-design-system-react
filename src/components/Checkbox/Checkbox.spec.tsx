import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { FormField } from '../FormField';

import { Checkbox } from './Checkbox';

describe('Checkbox', () => {
  it('ラベルがアクセシブルな名前になる', () => {
    render(<Checkbox>同意する</Checkbox>);

    expect(screen.getByRole('checkbox', { name: '同意する' })).toBeInTheDocument();
  });

  it('デフォルトは未チェックである', () => {
    render(<Checkbox>label</Checkbox>);

    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  it('クリックでチェック状態が切り替わる', () => {
    render(<Checkbox>label</Checkbox>);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(checkbox).toBeChecked();
  });

  it('onChange が呼ばれる', () => {
    const handleChange = vi.fn();
    render(<Checkbox onChange={handleChange}>label</Checkbox>);

    fireEvent.click(screen.getByRole('checkbox'));

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it('defaultChecked のときチェック済みで描画される', () => {
    render(<Checkbox defaultChecked>label</Checkbox>);

    expect(screen.getByRole('checkbox')).toBeChecked();
  });

  it('disabled のとき input が無効化され data-disabled が付与される', () => {
    render(<Checkbox disabled>label</Checkbox>);

    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).toBeDisabled();
    expect(checkbox.closest('label')).toHaveAttribute('data-disabled', 'true');
  });

  it('indeterminate のとき DOM プロパティが true になる', () => {
    render(<Checkbox indeterminate>label</Checkbox>);

    expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(true);
  });

  it('indeterminate 未指定のとき DOM プロパティは false である', () => {
    render(<Checkbox>label</Checkbox>);

    expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(false);
  });

  it('indeterminate の変化に追従する', () => {
    const { rerender } = render(<Checkbox>label</Checkbox>);

    expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(false);

    rerender(<Checkbox indeterminate>label</Checkbox>);

    expect(screen.getByRole<HTMLInputElement>('checkbox').indeterminate).toBe(true);
  });

  it('クリックで DOM の indeterminate が落ちても再レンダーで復元される', () => {
    const handleChange = vi.fn();
    const { rerender } = render(
      <Checkbox indeterminate checked={false} onChange={handleChange}>
        label
      </Checkbox>
    );

    const checkbox = screen.getByRole<HTMLInputElement>('checkbox');

    expect(checkbox.indeterminate).toBe(true);

    // ブラウザはクリック時に DOM の indeterminate を false へ落とす
    fireEvent.click(checkbox);

    expect(checkbox.indeterminate).toBe(false);

    // indeterminate prop は変わらないまま checked だけが更新されるケース
    rerender(
      <Checkbox indeterminate checked onChange={handleChange}>
        label
      </Checkbox>
    );

    expect(checkbox.indeterminate).toBe(true);
  });

  it('ラベルなしでも aria-label でアクセシブルな名前を持てる', () => {
    render(<Checkbox aria-label="単独チェックボックス" />);

    expect(screen.getByRole('checkbox', { name: '単独チェックボックス' })).toBeInTheDocument();
  });

  it('ネイティブ属性を input に渡す', () => {
    render(<Checkbox name="agree" value="yes" />);

    const checkbox = screen.getByRole('checkbox');

    expect(checkbox).toHaveAttribute('name', 'agree');
    expect(checkbox).toHaveAttribute('value', 'yes');
  });

  it('ref を input に転送する', () => {
    const ref = createRef<HTMLInputElement>();
    render(<Checkbox ref={ref}>label</Checkbox>);

    expect(ref.current).toBe(screen.getByRole('checkbox'));
  });

  it('ref を渡しても indeterminate が設定される', () => {
    const ref = createRef<HTMLInputElement>();
    render(
      <Checkbox ref={ref} indeterminate>
        label
      </Checkbox>
    );

    expect(ref.current?.indeterminate).toBe(true);
  });

  describe('FormField との連携', () => {
    it('FormField の disabled を引き継ぐ', () => {
      render(
        <FormField disabled>
          <Checkbox>同意する</Checkbox>
        </FormField>
      );

      expect(screen.getByRole('checkbox')).toBeDisabled();
    });

    it('自身に指定した値を優先する', () => {
      render(
        <FormField disabled>
          <Checkbox disabled={false}>同意する</Checkbox>
        </FormField>
      );

      expect(screen.getByRole('checkbox')).toBeEnabled();
    });
  });
});
