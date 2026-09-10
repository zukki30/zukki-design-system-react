import { fireEvent, render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Button, type ButtonSize } from './Button';
import styles from './Button.module.css';

describe('Button', () => {
  it('children をアクセシブルネームとして描画する', () => {
    render(<Button>送信</Button>);

    expect(screen.getByRole('button', { name: '送信' })).toBeInTheDocument();
  });

  it('クリックで onClick を呼ぶ', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>送信</Button>);

    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled のときクリックしても onClick を呼ばない', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        送信
      </Button>
    );

    const button = screen.getByRole('button', { name: '送信' });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('デフォルトの type は button で、指定すれば上書きできる', () => {
    const { rerender } = render(<Button>送信</Button>);
    expect(screen.getByRole('button', { name: '送信' })).toHaveAttribute('type', 'button');

    rerender(<Button type="submit">送信</Button>);
    expect(screen.getByRole('button', { name: '送信' })).toHaveAttribute('type', 'submit');
  });

  it('selected を data-selected に反映する', () => {
    const { rerender } = render(<Button>送信</Button>);
    expect(screen.getByRole('button', { name: '送信' })).not.toHaveAttribute('data-selected');

    rerender(<Button selected>送信</Button>);
    expect(screen.getByRole('button', { name: '送信' })).toHaveAttribute('data-selected', 'true');
  });

  it('startIcon / endIcon を描画し、有無を data 属性に反映する', () => {
    const { rerender } = render(<Button>送信</Button>);
    const button = () => screen.getByRole('button', { name: /送信/ });

    expect(button()).toHaveAttribute('data-has-start-icon', 'false');
    expect(button()).toHaveAttribute('data-has-end-icon', 'false');

    rerender(
      <Button
        startIcon={<span data-testid="start-icon" />}
        endIcon={<span data-testid="end-icon" />}
      >
        送信
      </Button>
    );

    expect(screen.getByTestId('start-icon')).toBeInTheDocument();
    expect(screen.getByTestId('end-icon')).toBeInTheDocument();
    expect(button()).toHaveAttribute('data-has-start-icon', 'true');
    expect(button()).toHaveAttribute('data-has-end-icon', 'true');
  });

  it('className をマージする', () => {
    render(<Button className="custom-class">送信</Button>);

    expect(screen.getByRole('button', { name: '送信' })).toHaveClass('custom-class');
  });

  it('loading のときアクセシブルネームを保ったまま aria-busy を立てる', () => {
    const { container } = render(<Button loading>送信</Button>);

    // ラベルが隠れて Spinner の文言に置き換わっていないことを名前で確認する
    const button = screen.getByRole('button', { name: '送信' });

    expect(button).toHaveAttribute('data-loading', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    // 状態は aria-busy が伝えるため、Spinner は支援技術から隠す
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('loading でないとき Spinner を描画せず aria-busy も付けない', () => {
    const { container } = render(<Button>送信</Button>);

    expect(screen.getByRole('button', { name: '送信' })).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('loading のときはキーボード活性化でも onClick を呼ばない', () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} loading>
        送信
      </Button>
    );

    // CSS の pointer-events では Enter / Space 由来の click を止められない
    fireEvent.click(screen.getByRole('button', { name: '送信' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([
    ['sm', '14px'],
    ['md', '24px'],
  ] as const satisfies ReadonlyArray<readonly [ButtonSize, string]>)(
    'size=%s のとき Spinner を %s で描画する',
    (size, spinnerSize) => {
      const { container } = render(
        <Button size={size} loading>
          送信
        </Button>
      );

      // startIcon などを渡すケースを足したときにアイコン側の svg を掴まないよう、
      // Spinner のラッパー配下に絞る
      const spinner = container.querySelector(`.${styles.button__loading} svg`);

      expect(spinner).toHaveAttribute('width', spinnerSize);
      expect(spinner).toHaveAttribute('height', spinnerSize);
    }
  );

  // 見た目は data-size / data-variant を CSS が引く形で出し分けている
  it.each(['sm', 'md'] as const)('size=%s を data-size に反映する', (size) => {
    render(<Button size={size}>送信</Button>);

    expect(screen.getByRole('button', { name: '送信' })).toHaveAttribute('data-size', size);
  });

  it.each([
    'default',
    'primary',
    'secondary',
    'success',
    'failure',
    'profile',
    'works',
    'outputs',
  ] as const)('variant=%s を data-variant に反映する', (variant) => {
    render(<Button variant={variant}>送信</Button>);

    expect(screen.getByRole('button', { name: '送信' })).toHaveAttribute('data-variant', variant);
  });

  it('見た目を決める data-* は利用側から上書きできない', () => {
    // data-* はスタイルの分岐に使うため、props と食い違わせない。
    // 食い違わせられると、variant は default なのに primary の見た目になる
    render(
      <Button
        variant="default"
        size="md"
        data-variant="primary"
        data-size="sm"
        data-selected="true"
        data-loading="true"
      >
        送信
      </Button>
    );

    const button = screen.getByRole('button', { name: '送信' });

    expect(button).toHaveAttribute('data-variant', 'default');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).not.toHaveAttribute('data-selected');
    expect(button).not.toHaveAttribute('data-loading');
  });

  it('size / variant を省略すると md / default になる', () => {
    render(<Button>送信</Button>);

    const button = screen.getByRole('button', { name: '送信' });

    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).toHaveAttribute('data-variant', 'default');
  });

  it('ref を button に転送する', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>送信</Button>);

    expect(ref.current).toBe(screen.getByRole('button', { name: '送信' }));
  });
});
