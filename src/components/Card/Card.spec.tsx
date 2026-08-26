import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { headingLevels } from '@/types';

import { Card } from './Card';
import { cardBody, cardFooter, cardHeader } from './Card.css';

// styleVariants の合成結果はスペース区切りの複数クラスになるため、個別のクラスへ分解する
const classesOf = (className: string) => className.split(' ');

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

    it('size に応じたクラスを適用する', () => {
      const { rerender } = render(
        <Card>
          <Card.Header data-testid="header">ヘッダー</Card.Header>
        </Card>
      );

      expect(screen.getByTestId('header')).toHaveClass(...classesOf(cardHeader.md));

      rerender(
        <Card size="sm">
          <Card.Header data-testid="header">ヘッダー</Card.Header>
        </Card>
      );

      expect(screen.getByTestId('header')).toHaveClass(...classesOf(cardHeader.sm));
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

    it('Card.Title は level 未指定のとき div で描画し、見出しとして扱わない', () => {
      render(
        <Card>
          <Card.Header>
            <Card.Title data-testid="title">タイトル</Card.Title>
          </Card.Header>
        </Card>
      );

      expect(screen.getByTestId('title').tagName).toBe('DIV');
      expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });

    it.each(headingLevels)('Card.Title は level=%i を指定すると見出しで描画する', (level) => {
      render(
        <Card>
          <Card.Header>
            <Card.Title data-testid="title" level={level}>
              タイトル
            </Card.Title>
          </Card.Header>
        </Card>
      );

      const heading = screen.getByRole('heading', { level, name: 'タイトル' });

      expect(heading).toBe(screen.getByTestId('title'));
      expect(heading.tagName).toBe(`H${level}`);
    });

    it('Card.Title は level 指定時も ref を見出し要素に転送する', () => {
      const ref = createRef<HTMLHeadingElement>();
      render(
        <Card>
          <Card.Header>
            <Card.Title ref={ref} level={3}>
              タイトル
            </Card.Title>
          </Card.Header>
        </Card>
      );

      expect(ref.current).toBe(screen.getByRole('heading', { level: 3 }));
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

    it('size に応じたクラスを適用する', () => {
      const { rerender } = render(
        <Card>
          <Card.Body data-testid="body">本文</Card.Body>
        </Card>
      );

      expect(screen.getByTestId('body')).toHaveClass(...classesOf(cardBody.md));

      rerender(
        <Card size="sm">
          <Card.Body data-testid="body">本文</Card.Body>
        </Card>
      );

      expect(screen.getByTestId('body')).toHaveClass(...classesOf(cardBody.sm));
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

    it('size に応じたクラスを適用する', () => {
      const { rerender } = render(
        <Card>
          <Card.Footer data-testid="footer">フッター</Card.Footer>
        </Card>
      );

      expect(screen.getByTestId('footer')).toHaveClass(...classesOf(cardFooter.md));

      rerender(
        <Card size="sm">
          <Card.Footer data-testid="footer">フッター</Card.Footer>
        </Card>
      );

      expect(screen.getByTestId('footer')).toHaveClass(...classesOf(cardFooter.sm));
    });
  });
  describe('ネストした Card', () => {
    it('内側の Card の size が外側の size に影響されない', () => {
      render(
        <Card size="sm">
          <Card.Body data-testid="outer-body">
            <Card size="md">
              <Card.Body data-testid="inner-body">本文</Card.Body>
            </Card>
          </Card.Body>
        </Card>
      );

      expect(screen.getByTestId('outer-body')).toHaveClass(...classesOf(cardBody.sm));
      expect(screen.getByTestId('inner-body')).toHaveClass(...classesOf(cardBody.md));
    });
  });

  describe('Card の外での使用', () => {
    afterEach(() => {
      vi.restoreAllMocks();
    });

    // size を必要とするパーツだけが context を読むため、誤用を検知できるのもこの 3 つ。
    // Dialog.Header などと同じく、context を使わないパーツは単体でも描画できる
    const contextDependentParts = [
      ['Card.Header', <Card.Header key="header" />],
      ['Card.Body', <Card.Body key="body" />],
      ['Card.Footer', <Card.Footer key="footer" />],
    ] as const;

    it.each(contextDependentParts)('%s は Card の外で使うと例外を投げる', (_name, element) => {
      // React が投げられたエラーをコンソールへ出力するため、テスト出力を汚さないよう抑制する
      vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => render(element)).toThrow(
        'Card のサブコンポーネントは <Card> の内側で使用してください'
      );
    });

    const standaloneParts = [
      ['Card.Image', <Card.Image key="image" />],
      ['Card.Title', <Card.Title key="title" />],
      ['Card.Action', <Card.Action key="action" />],
    ] as const;

    it.each(standaloneParts)('%s は size を参照しないため単体でも描画できる', (_name, element) => {
      expect(() => render(element)).not.toThrow();
    });
  });
});
