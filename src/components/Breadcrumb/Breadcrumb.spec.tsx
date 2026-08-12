import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Breadcrumb, type BreadcrumbItem } from './Breadcrumb';

const items: BreadcrumbItem[] = [
  { label: 'HOME', href: '/' },
  { label: '中間ページ', href: '/middle' },
  { label: '現在のページ' },
];

describe('Breadcrumb', () => {
  it('全ての項目を描画する', () => {
    render(<Breadcrumb items={items} />);

    expect(screen.getByText('HOME')).toBeInTheDocument();
    expect(screen.getByText('中間ページ')).toBeInTheDocument();
    expect(screen.getByText('現在のページ')).toBeInTheDocument();
  });

  it('nav に aria-label を付与する（デフォルト）', () => {
    render(<Breadcrumb items={items} />);

    expect(screen.getByRole('navigation', { name: 'パンくずリスト' })).toBeInTheDocument();
  });

  it('aria-label を上書きできる', () => {
    render(<Breadcrumb items={items} aria-label="ナビゲーション" />);

    expect(screen.getByRole('navigation', { name: 'ナビゲーション' })).toBeInTheDocument();
  });

  it('href のある項目はリンクとして描画する', () => {
    render(<Breadcrumb items={items} />);

    expect(screen.getByRole('link', { name: 'HOME' })).toHaveAttribute('href', '/');
    expect(screen.getByRole('link', { name: '中間ページ' })).toHaveAttribute('href', '/middle');
  });

  it('末尾項目はリンクにせず aria-current="page" を付与する', () => {
    render(<Breadcrumb items={items} />);

    expect(screen.queryByRole('link', { name: '現在のページ' })).not.toBeInTheDocument();

    // ラベルはラッパー要素に包まれるため、内部構造に依存しないよう祖先まで遡って確認する
    expect(screen.getByText('現在のページ').closest('[aria-current="page"]')).toBeInTheDocument();
  });

  it('項目数 - 1 個の区切りアイコンを描画する', () => {
    const { container } = render(<Breadcrumb items={items} />);

    // chevronRight が区切りとして項目間に表示される
    const separators = container.querySelectorAll('svg');
    expect(separators).toHaveLength(items.length - 1);
  });

  it('href のない中間項目はリンクにしない', () => {
    const withoutHref: BreadcrumbItem[] = [{ label: 'HOME' }, { label: '現在のページ' }];
    render(<Breadcrumb items={withoutHref} />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('HOME')).toBeInTheDocument();
  });

  it('icon を項目内に描画する', () => {
    const withIcon: BreadcrumbItem[] = [
      { label: 'HOME', href: '/', icon: <span data-testid="home-icon" /> },
      { label: '現在のページ' },
    ];
    render(<Breadcrumb items={withIcon} />);

    expect(screen.getByTestId('home-icon')).toBeInTheDocument();
  });

  it('1項目のみのとき区切りアイコンを描画しない', () => {
    const single: BreadcrumbItem[] = [{ label: 'HOME' }];
    const { container } = render(<Breadcrumb items={single} />);

    expect(container.querySelectorAll('svg')).toHaveLength(0);
    expect(screen.getByText('HOME').closest('[aria-current="page"]')).toBeInTheDocument();
  });

  it('ref を nav に転送する', () => {
    const ref = createRef<HTMLElement>();
    render(<Breadcrumb ref={ref} items={items} />);

    expect(ref.current).toBe(screen.getByRole('navigation'));
  });
});
