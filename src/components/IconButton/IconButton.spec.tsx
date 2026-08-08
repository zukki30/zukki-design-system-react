import { fireEvent, render, screen } from '@testing-library/react';
import type { ComponentProps, ReactElement } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Icon } from '../Icon';
import { Spinner } from '../Spinner';

import { IconButton } from './IconButton';

const icon = <Icon name="home" width={16} height={16} />;

type IconButtonProps = ComponentProps<typeof IconButton>;

const SPINNER_LABEL = 'loading';

/**
 * 描画結果の Spinner のクラス名を取り出す。
 * IconButton が渡す variant を、Spinner を直接描画した場合と突き合わせるために使う
 */
const getSpinnerClassName = (ui: ReactElement) => {
  const { unmount } = render(ui);
  // SVG 要素の className は SVGAnimatedString のため属性値で取得する
  const className = screen.getByRole('img', { name: SPINNER_LABEL }).getAttribute('class');
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
    render(
      <IconButton aria-label="ホーム" loading>
        {icon}
      </IconButton>
    );

    // アクセシブルネームは aria-label 由来なので、loading 中も維持される
    const button = screen.getByRole('button', { name: 'ホーム' });

    expect(button).toHaveAttribute('data-loading', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByRole('img', { name: SPINNER_LABEL })).toBeInTheDocument();
  });

  it('loading でないとき Spinner を描画せず aria-busy も付けない', () => {
    render(<IconButton aria-label="ホーム">{icon}</IconButton>);

    expect(screen.getByRole('button', { name: 'ホーム' })).not.toHaveAttribute('aria-busy');
    expect(screen.queryByRole('img', { name: SPINNER_LABEL })).not.toBeInTheDocument();
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
        {icon}
      </IconButton>
    );
    const expected = getSpinnerClassName(
      <Spinner variant={spinnerVariant} aria-label={SPINNER_LABEL} />
    );

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
