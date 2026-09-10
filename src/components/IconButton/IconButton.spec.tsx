import { fireEvent, render, screen } from '@testing-library/react';
import { createRef, type ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Icon } from '../Icon';
import { Spinner, type SpinnerVariant } from '../Spinner';

import { IconButton, type IconButtonProps, type IconButtonVariant } from './IconButton';

const icon = <Icon name="home" width={16} height={16} />;

/**
 * 描画結果の Spinner のクラス名を取り出す。
 * IconButton が渡す variant を、Spinner を直接描画した場合と突き合わせるために使う。
 *
 * Spinner は装飾（aria-hidden）でロールから引けないため DOM を辿る。
 * children に svg を渡さないことで、含まれる svg は Spinner だけになる
 */
const getSpinnerVariant = (ui: ReactElement) => {
  const { container, unmount } = render(ui);
  // Spinner の配色は data-variant で表される
  const variant = container.querySelector('svg')?.getAttribute('data-variant') ?? null;
  if (variant === null) {
    throw new Error('spinner variant not found');
  }
  unmount();

  return variant;
};

describe('IconButton', () => {
  it('aria-label をアクセシブルネームとして描画する', () => {
    render(<IconButton aria-label="ホーム">{icon}</IconButton>);

    expect(screen.getByRole('button', { name: 'ホーム' })).toBeInTheDocument();
  });

  it('aria-label なしでも実行時は描画される（型の必須化は tsc が検知する）', () => {
    // aria-label を省いた Props は型として成立しない。必須化が外れると
    // 「未使用の @ts-expect-error」として tsc -b が失敗する
    // @ts-expect-error アイコンのみのボタンのため aria-label は必須
    const propsWithoutAriaLabel: IconButtonProps = { children: icon };

    render(<IconButton {...propsWithoutAriaLabel} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('クリックで onClick を呼ぶ', () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="ホーム" onClick={onClick}>
        {icon}
      </IconButton>
    );

    fireEvent.click(screen.getByRole('button', { name: 'ホーム' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled のときクリックしても onClick を呼ばない', () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="ホーム" onClick={onClick} disabled>
        {icon}
      </IconButton>
    );

    const button = screen.getByRole('button', { name: 'ホーム' });
    fireEvent.click(button);

    expect(button).toBeDisabled();
    expect(onClick).not.toHaveBeenCalled();
  });

  it('デフォルトの type は button で、指定すれば上書きできる', () => {
    const { rerender } = render(<IconButton aria-label="ホーム">{icon}</IconButton>);
    expect(screen.getByRole('button', { name: 'ホーム' })).toHaveAttribute('type', 'button');

    rerender(
      <IconButton aria-label="ホーム" type="submit">
        {icon}
      </IconButton>
    );
    expect(screen.getByRole('button', { name: 'ホーム' })).toHaveAttribute('type', 'submit');
  });

  it('selected を data-selected に反映する', () => {
    const { rerender } = render(<IconButton aria-label="ホーム">{icon}</IconButton>);
    expect(screen.getByRole('button', { name: 'ホーム' })).not.toHaveAttribute('data-selected');

    rerender(
      <IconButton aria-label="ホーム" selected>
        {icon}
      </IconButton>
    );
    expect(screen.getByRole('button', { name: 'ホーム' })).toHaveAttribute('data-selected', 'true');
  });

  it('className をマージする', () => {
    render(
      <IconButton aria-label="ホーム" className="custom-class">
        {icon}
      </IconButton>
    );

    expect(screen.getByRole('button', { name: 'ホーム' })).toHaveClass('custom-class');
  });

  it('loading のとき Spinner を描画し aria-busy を立てる', () => {
    const { container } = render(
      <IconButton aria-label="ホーム" loading>
        <span data-testid="icon" />
      </IconButton>
    );

    // アクセシブルネームは aria-label 由来なので、loading 中も維持される
    const button = screen.getByRole('button', { name: 'ホーム' });

    expect(button).toHaveAttribute('data-loading', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    // 状態は aria-busy が伝えるため、Spinner は支援技術から隠す
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('loading でないとき Spinner を描画せず aria-busy も付けない', () => {
    const { container } = render(
      <IconButton aria-label="ホーム">
        <span data-testid="icon" />
      </IconButton>
    );

    expect(screen.getByRole('button', { name: 'ホーム' })).not.toHaveAttribute('aria-busy');
    expect(container.querySelector('svg')).not.toBeInTheDocument();
  });

  it('loading のときはキーボード活性化でも onClick を呼ばない', () => {
    const onClick = vi.fn();
    render(
      <IconButton aria-label="ホーム" onClick={onClick} loading>
        {icon}
      </IconButton>
    );

    // CSS の pointer-events では Enter / Space 由来の click を止められない
    fireEvent.click(screen.getByRole('button', { name: 'ホーム' }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it.each([
    ['primary', 'dark'],
    ['secondary', 'dark'],
    ['primary-exposed', 'primary'],
    ['secondary-exposed', 'light'],
  ] as const satisfies ReadonlyArray<readonly [IconButtonVariant, SpinnerVariant]>)(
    'variant=%s のとき Spinner は %s の配色になる',
    (variant, spinnerVariant) => {
      const actual = getSpinnerVariant(
        <IconButton aria-label="ホーム" variant={variant} loading>
          <span data-testid="icon" />
        </IconButton>
      );
      const expected = getSpinnerVariant(<Spinner variant={spinnerVariant} />);

      expect(actual).toBe(expected);
    }
  );

  // 見た目は data-size / data-variant を CSS が引く形で出し分けている
  it.each(['sm', 'md'] as const)('size=%s を data-size に反映する', (size) => {
    render(
      <IconButton aria-label="ホーム" size={size}>
        {icon}
      </IconButton>
    );

    expect(screen.getByRole('button', { name: 'ホーム' })).toHaveAttribute('data-size', size);
  });

  it('見た目を決める data-* は利用側から上書きできない', () => {
    // data-* はスタイルの分岐に使うため、props と食い違わせない。
    // 食い違わせられると、variant は primary なのに secondary の見た目になる
    render(
      <IconButton
        aria-label="ホーム"
        variant="primary"
        size="md"
        data-variant="secondary"
        data-size="sm"
        data-selected="true"
        data-loading="true"
      >
        {icon}
      </IconButton>
    );

    const button = screen.getByRole('button', { name: 'ホーム' });

    expect(button).toHaveAttribute('data-variant', 'primary');
    expect(button).toHaveAttribute('data-size', 'md');
    expect(button).not.toHaveAttribute('data-selected');
    expect(button).not.toHaveAttribute('data-loading');
  });

  it.each(['primary', 'secondary', 'primary-exposed', 'secondary-exposed'] as const)(
    'variant=%s を data-variant に反映する',
    (variant) => {
      render(
        <IconButton aria-label="ホーム" variant={variant}>
          {icon}
        </IconButton>
      );

      expect(screen.getByRole('button', { name: 'ホーム' })).toHaveAttribute(
        'data-variant',
        variant
      );
    }
  );

  it('ref を button に転送する', () => {
    const ref = createRef<HTMLButtonElement>();
    render(
      <IconButton ref={ref} aria-label="ホーム">
        {icon}
      </IconButton>
    );

    expect(ref.current).toBe(screen.getByRole('button', { name: 'ホーム' }));
  });
});
