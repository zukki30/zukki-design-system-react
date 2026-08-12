import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { InputNumber } from './InputNumber';

describe('InputNumber', () => {
  it('type=number の入力を描画する', () => {
    render(<InputNumber placeholder="0" />);

    expect(screen.getByPlaceholderText('0')).toHaveAttribute('type', 'number');
  });

  it('value を表示する', () => {
    render(<InputNumber defaultValue={186} />);

    expect(screen.getByRole('spinbutton')).toHaveValue(186);
  });

  it('増やすボタンで値が増える', () => {
    render(<InputNumber defaultValue={5} />);

    fireEvent.click(screen.getByLabelText('増やす'));

    expect(screen.getByRole('spinbutton')).toHaveValue(6);
  });

  it('減らすボタンで値が減る', () => {
    render(<InputNumber defaultValue={5} />);

    fireEvent.click(screen.getByLabelText('減らす'));

    expect(screen.getByRole('spinbutton')).toHaveValue(4);
  });

  it('step を考慮して増減する', () => {
    render(<InputNumber defaultValue={0} step={5} />);

    fireEvent.click(screen.getByLabelText('増やす'));

    expect(screen.getByRole('spinbutton')).toHaveValue(5);
  });

  it('max を超えて増えない', () => {
    render(<InputNumber defaultValue={10} max={10} />);

    fireEvent.click(screen.getByLabelText('増やす'));

    expect(screen.getByRole('spinbutton')).toHaveValue(10);
  });

  it('スピンボタン操作で onChange が呼ばれる', () => {
    const handleChange = vi.fn();
    render(<InputNumber defaultValue={1} onChange={handleChange} />);

    fireEvent.click(screen.getByLabelText('増やす'));

    expect(handleChange).toHaveBeenCalled();
  });

  it('disabled のとき input とスピンボタンが無効化される', () => {
    render(<InputNumber disabled defaultValue={1} />);

    expect(screen.getByRole('spinbutton')).toBeDisabled();
    expect(screen.getByLabelText('増やす')).toBeDisabled();
    expect(screen.getByLabelText('減らす')).toBeDisabled();
  });

  it('disabled のときスピンボタンを押しても値が変わらない', () => {
    render(<InputNumber disabled defaultValue={1} />);

    fireEvent.click(screen.getByLabelText('増やす'));

    expect(screen.getByRole('spinbutton')).toHaveValue(1);
  });

  it('error のとき data-error と aria-invalid が付与される', () => {
    render(<InputNumber error defaultValue={1} />);

    const field = screen.getByRole('spinbutton');

    expect(field).toHaveAttribute('aria-invalid', 'true');
    expect(field.closest('div')).toHaveAttribute('data-error', 'true');
  });

  it('ネイティブ属性を input に渡す', () => {
    render(<InputNumber name="amount" min={0} max={100} />);

    const field = screen.getByRole('spinbutton');

    expect(field).toHaveAttribute('name', 'amount');
    expect(field).toHaveAttribute('min', '0');
    expect(field).toHaveAttribute('max', '100');
  });

  // 小数を受け付けるかどうかでモバイルのキーパッドを出し分ける
  it.each([
    [undefined, 'numeric'],
    ['any', 'decimal'],
    [1, 'numeric'],
    ['2', 'numeric'],
    [0.1, 'decimal'],
    ['0.5', 'decimal'],
    // 数値として解釈できない値は既定の整数扱いに倒す
    ['invalid', 'numeric'],
  ] as const)('step=%s のとき inputMode は %s になる', (step, expected) => {
    render(<InputNumber step={step} />);

    expect(screen.getByRole('spinbutton')).toHaveAttribute('inputmode', expected);
  });

  // 有効値は step base + step の倍数なので、min が小数なら整数 step でも小数になる
  it.each([
    [0, 'numeric'],
    [-1, 'numeric'],
    [0.5, 'decimal'],
    ['1.25', 'decimal'],
  ] as const)('step 未指定でも min=%s なら inputMode は %s になる', (min, expected) => {
    render(<InputNumber min={min} />);

    expect(screen.getByRole('spinbutton')).toHaveAttribute('inputmode', expected);
  });

  it('inputMode を利用側から上書きできる', () => {
    render(<InputNumber inputMode="text" />);

    expect(screen.getByRole('spinbutton')).toHaveAttribute('inputmode', 'text');
  });

  it('ref を input に転送する', () => {
    const ref = createRef<HTMLInputElement>();
    render(<InputNumber ref={ref} />);

    expect(ref.current).toBe(screen.getByRole('spinbutton'));
  });

  it('ref を渡してもスピンボタンで値を増減できる', () => {
    const ref = createRef<HTMLInputElement>();
    render(<InputNumber ref={ref} defaultValue={5} />);

    fireEvent.click(screen.getByLabelText('増やす'));

    expect(screen.getByRole('spinbutton')).toHaveValue(6);
  });
});
