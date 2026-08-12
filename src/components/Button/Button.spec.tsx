import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Button } from './Button';
import { buttonLoading } from './Button.css';

type ButtonProps = ComponentProps<typeof Button>;

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
  ] as const satisfies ReadonlyArray<readonly [NonNullable<ButtonProps['size']>, string]>)(
    'size=%s のとき Spinner を %s で描画する',
    (size, spinnerSize) => {
      const { container } = render(
        <Button size={size} loading>
          送信
        </Button>
      );

      // startIcon などを渡すケースを足したときにアイコン側の svg を掴まないよう、
      // Spinner のラッパー配下に絞る
      const spinner = container.querySelector(`.${buttonLoading} svg`);

      expect(spinner).toHaveAttribute('width', spinnerSize);
      expect(spinner).toHaveAttribute('height', spinnerSize);
    }
  );

  it.each([
    ['md', 'sm'],
    ['sm', 'md'],
  ] as const)('size=%s と size=%s でスタイルが変わる', (size, otherSize) => {
    const { rerender } = render(<Button size={size}>送信</Button>);
    const className = screen.getByRole('button', { name: '送信' }).className;

    rerender(<Button size={otherSize}>送信</Button>);

    expect(screen.getByRole('button', { name: '送信' }).className).not.toBe(className);
  });

  it.each([
    ['default', 'primary'],
    ['primary', 'secondary'],
    ['secondary', 'success'],
    ['success', 'failure'],
    ['failure', 'default'],
  ] as const)('variant=%s と variant=%s でスタイルが変わる', (variant, otherVariant) => {
    const { rerender } = render(<Button variant={variant}>送信</Button>);
    const className = screen.getByRole('button', { name: '送信' }).className;

    rerender(<Button variant={otherVariant}>送信</Button>);

    expect(screen.getByRole('button', { name: '送信' }).className).not.toBe(className);
  });

  it('ref を button に転送する', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<Button ref={ref}>送信</Button>);

    expect(ref.current).toBe(screen.getByRole('button', { name: '送信' }));
  });
});
