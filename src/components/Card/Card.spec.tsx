import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it } from 'vitest';

import { Card } from './Card';

describe('Card', () => {
  it('children を描画する', () => {
    render(
      <Card>
        <Card.Body>本文テキスト</Card.Body>
      </Card>
    );

    expect(screen.getByText('本文テキスト')).toBeInTheDocument();
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

  it('ref を div に転送する', () => {
    const ref = createRef<HTMLDivElement>();
    render(
      <Card ref={ref} data-testid="card">
        本文
      </Card>
    );

    expect(ref.current).toBe(screen.getByTestId('card'));
  });

  describe('Card.Image', () => {
    it('children を描画し、ref・ネイティブ属性を転送する', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Card>
          <Card.Image ref={ref} data-testid="image" className="custom">
            <img src="x.png" alt="サムネイル" />
          </Card.Image>
        </Card>
      );

      const image = screen.getByTestId('image');

      expect(screen.getByAltText('サムネイル')).toBeInTheDocument();
      expect(ref.current).toBe(image);
      expect(image).toHaveClass('custom');
    });
  });

  describe('Card.Header', () => {
    it('children を描画し、ref・ネイティブ属性を転送する', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Card>
          <Card.Header ref={ref} data-testid="header" className="custom">
            ヘッダー
          </Card.Header>
        </Card>
      );

      const header = screen.getByTestId('header');

      expect(header).toHaveTextContent('ヘッダー');
      expect(ref.current).toBe(header);
      expect(header).toHaveClass('custom');
    });

    it('size に応じてクラスを切り替える', () => {
      const { rerender } = render(
        <Card>
          <Card.Header data-testid="header">ヘッダー</Card.Header>
        </Card>
      );

      const mdClassName = screen.getByTestId('header').className;

      rerender(
        <Card size="sm">
          <Card.Header data-testid="header">ヘッダー</Card.Header>
        </Card>
      );

      expect(screen.getByTestId('header').className).not.toBe(mdClassName);
    });
  });

  describe('Card.Title / Card.Action', () => {
    it('Card.Title 無しでも Card.Action を描画する', () => {
      render(
        <Card>
          <Card.Header>
            <Card.Action>
              <span>more</span>
            </Card.Action>
          </Card.Header>
        </Card>
      );

      expect(screen.getByText('more')).toBeInTheDocument();
    });

    it('ref・ネイティブ属性を転送する', () => {
      const titleRef = createRef<HTMLDivElement>();
      const actionRef = createRef<HTMLDivElement>();
      render(
        <Card>
          <Card.Header>
            <Card.Title ref={titleRef} data-testid="title" className="custom-title">
              タイトル
            </Card.Title>
            <Card.Action ref={actionRef} data-testid="action" className="custom-action">
              more
            </Card.Action>
          </Card.Header>
        </Card>
      );

      expect(titleRef.current).toBe(screen.getByTestId('title'));
      expect(actionRef.current).toBe(screen.getByTestId('action'));
      expect(screen.getByTestId('title')).toHaveClass('custom-title');
      expect(screen.getByTestId('action')).toHaveClass('custom-action');
    });
  });

  describe('Card.Body', () => {
    it('children を描画し、ref・ネイティブ属性を転送する', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Card>
          <Card.Body ref={ref} data-testid="body" className="custom">
            本文
          </Card.Body>
        </Card>
      );

      const body = screen.getByTestId('body');

      expect(body).toHaveTextContent('本文');
      expect(ref.current).toBe(body);
      expect(body).toHaveClass('custom');
    });

    it('size に応じてクラスを切り替える', () => {
      const { rerender } = render(
        <Card>
          <Card.Body data-testid="body">本文</Card.Body>
        </Card>
      );

      const mdClassName = screen.getByTestId('body').className;

      rerender(
        <Card size="sm">
          <Card.Body data-testid="body">本文</Card.Body>
        </Card>
      );

      expect(screen.getByTestId('body').className).not.toBe(mdClassName);
    });
  });

  describe('Card.Footer', () => {
    it('children を描画し、ref・ネイティブ属性を転送する', () => {
      const ref = createRef<HTMLDivElement>();
      render(
        <Card>
          <Card.Footer ref={ref} data-testid="footer" className="custom">
            フッター
          </Card.Footer>
        </Card>
      );

      const footer = screen.getByTestId('footer');

      expect(footer).toHaveTextContent('フッター');
      expect(ref.current).toBe(footer);
      expect(footer).toHaveClass('custom');
    });

    it('size に応じてクラスを切り替える', () => {
      const { rerender } = render(
        <Card>
          <Card.Footer data-testid="footer">フッター</Card.Footer>
        </Card>
      );

      const mdClassName = screen.getByTestId('footer').className;

      rerender(
        <Card size="sm">
          <Card.Footer data-testid="footer">フッター</Card.Footer>
        </Card>
      );

      expect(screen.getByTestId('footer').className).not.toBe(mdClassName);
    });
  });
});
