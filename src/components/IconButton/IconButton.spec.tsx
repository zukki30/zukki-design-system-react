import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Icon } from '../Icon';
import { Spinner } from '../Spinner';

import { IconButton } from './IconButton';

const icon = <Icon name="home" width={16} height={16} />;

type IconButtonProps = ComponentProps<typeof IconButton>;

/**
 * 描画結果の Spinner のクラス名を取り出す。
 * IconButton が渡す variant を、Spinner を直接描画した場合と突き合わせるために使う。
 *
 * Spinner は装飾（aria-hidden）でロールから引けないため DOM を辿る。
 * children に svg を渡さないことで、含まれる svg は Spinner だけになる
 */
const getSpinnerClassName = (ui: ReactElement) => {
  const { container, unmount } = render(ui);
  // SVG 要素の className は SVGAnimatedString のため属性値で取得する
  const className = container.querySelector('svg')?.getAttribute('class') ?? null;
  if (className === null) {
    throw new Error('spinner class not found');
  }
  unmount();

  return className;
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
  ] as const satisfies ReadonlyArray<
    readonly [NonNullable<IconButtonProps['variant']>, ComponentProps<typeof Spinner>['variant']]
  >)('variant=%s のとき Spinner は %s の配色になる', (variant, spinnerVariant) => {
    const actual = getSpinnerClassName(
      <IconButton aria-label="ホーム" variant={variant} loading>
        <span data-testid="icon" />
      </IconButton>
    );
    const expected = getSpinnerClassName(<Spinner variant={spinnerVariant} />);

    expect(actual).toBe(expected);
  });

  it.each([
    ['md', 'sm'],
    ['sm', 'md'],
  ] as const)('size=%s と size=%s でスタイルが変わる', (size, otherSize) => {
    const { rerender } = render(
      <IconButton aria-label="ホーム" size={size}>
        {icon}
      </IconButton>
    );
    const className = screen.getByRole('button', { name: 'ホーム' }).className;

    rerender(
      <IconButton aria-label="ホーム" size={otherSize}>
        {icon}
      </IconButton>
    );

    expect(screen.getByRole('button', { name: 'ホーム' }).className).not.toBe(className);
  });
});
