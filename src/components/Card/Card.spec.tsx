import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Card } from './Card';

describe('Card', () => {
  it('children（本文）を描画する', () => {
    render(<Card>本文テキスト</Card>);

    expect(screen.getByText('本文テキスト')).toBeInTheDocument();
  });

  it('title を描画する', () => {
    render(<Card title="カードタイトル">本文</Card>);

    expect(screen.getByText('カードタイトル')).toBeInTheDocument();
  });

  it('title 未指定のときヘッダーを描画しない', () => {
    render(
      <Card action={<span>more</span>} title={undefined}>
        本文
      </Card>
    );

    // action はヘッダー内なので title が無ければ描画されない
    expect(screen.queryByText('more')).not.toBeInTheDocument();
  });

  it('action は title がある場合のみ描画する', () => {
    render(
      <Card title="タイトル" action={<span>more</span>}>
        本文
      </Card>
    );

    expect(screen.getByText('more')).toBeInTheDocument();
  });

  it('image を描画する', () => {
    render(
      <Card image={<img src="x.png" alt="サムネイル" />} title="タイトル">
        本文
      </Card>
    );

    expect(screen.getByAltText('サムネイル')).toBeInTheDocument();
  });

  it('footer を描画する', () => {
    render(<Card footer={<span>フッター</span>}>本文</Card>);

    expect(screen.getByText('フッター')).toBeInTheDocument();
  });

  it('image・footer 未指定のとき描画しない', () => {
    render(<Card>本文</Card>);

    expect(screen.queryByRole('img')).not.toBeInTheDocument();
    expect(screen.queryByText('フッター')).not.toBeInTheDocument();
  });

  it('size を data 属性に反映する（デフォルト md）', () => {
    const { rerender } = render(<Card data-testid="card">本文</Card>);

    expect(screen.getByTestId('card')).toHaveAttribute('data-size', 'md');

    rerender(
      <Card data-testid="card" size="sm">
        本文
      </Card>
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-size', 'sm');
  });

  it('ネイティブ属性を div に渡す', () => {
    render(
      <Card data-testid="card" aria-label="記事カード">
        本文
      </Card>
    );

    expect(screen.getByTestId('card')).toHaveAttribute('aria-label', '記事カード');
  });
});
