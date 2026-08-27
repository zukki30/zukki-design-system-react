import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { vars } from '@/styles/theme.css';

import { Card } from './Card';

const moreLinkStyle = {
  color: vars.color.textOnLink.default,
  fontWeight: 700,
  fontSize: '0.875rem',
  textDecoration: 'underline',
};

// href は anchor-is-valid を満たすため実在するパスにしつつ、
// ストーリーの表示が壊れないよう遷移だけ止める
const MoreLink = () => (
  <a href="/" style={moreLinkStyle} onClick={(event) => event.preventDefault()}>
    more
  </a>
);

/**
 * カードの表示幅を固定するラッパー
 */
const Frame = ({ children }: { children: ReactNode }) => (
  <div style={{ width: '300px' }}>{children}</div>
);

const Image = () => (
  <Card.Image>
    <div style={{ height: '140px', width: '100%', backgroundColor: '#d9d9d9' }} />
  </Card.Image>
);

const Header = () => (
  <Card.Header>
    <Card.Title>Card title</Card.Title>
    <Card.Action>
      <MoreLink />
    </Card.Action>
  </Card.Header>
);

const Body = () => (
  <Card.Body>
    <div>
      <p style={{ margin: 0, lineHeight: 1.5 }}>Card simple text</p>
      <p style={{ margin: 0, lineHeight: 1.5 }}>Card simple</p>
    </div>
  </Card.Body>
);

const Footer = () => (
  <Card.Footer>
    <MoreLink />
  </Card.Footer>
);

// parameters.docs.description.component を指定すると Card の JSDoc は autodocs に出なくなるため、
// 元の説明と構成例もここに含める
const docsDescription = [
  '表示する領域を compound components で合成するカードです。',
  '余白の大きさ（`size`）は context 経由でサブコンポーネントに共有されます。',
  '',
  '### 構成',
  '',
  '```tsx',
  '<Card size="sm">',
  '  <Card.Image>',
  '    <img src="thumbnail.png" alt="" />',
  '  </Card.Image>',
  '  <Card.Header>',
  '    <Card.Title>タイトル</Card.Title>',
  '    <Card.Action>',
  '      <a href="#">more</a>',
  '    </Card.Action>',
  '  </Card.Header>',
  '  <Card.Body>本文</Card.Body>',
  '  <Card.Footer>フッター</Card.Footer>',
  '</Card>',
  '```',
  '',
  '### タイトルの見出しレベル',
  '',
  '`Card.Title` は既定では `div` で描画し、見出しとしての意味付けを行いません。',
  'カードが文書構造のどの階層に置かれるかはライブラリ側からは分からないため、',
  'レベルを勝手に決めない方針です。',
  '',
  '見出しとして扱いたい場合は、周囲の見出し階層に合わせて `level` を指定してください。',
  '`role="heading"` と `aria-level` を手で組み合わせる必要はありません。',
  '変わるのは意味付けだけで、見た目はレベルによらず同じです。',
  '',
  '旧来の `role="heading"` / `aria-level` を使っている場合は、両方外して `level` に置き換えてください。',
  'ARIA は要素の暗黙のロールより優先されるため、併記すると `aria-level` の値が支援技術に伝わり、',
  '`level` と食い違います。',
  '',
  'なお `Card.Title` は Card.Action を押し出さないよう 1 行に固定され、',
  'あふれたぶんは省略記号で表示されます。省略してもテキストは DOM に残るため',
  'スクリーンリーダーは全文を読み上げますが、見出しとして使う場合は',
  '視覚的に切れない長さに収めるのが望ましいです。',
  '',
  '```tsx',
  '<h2>おすすめ</h2>',
  '',
  '<Card>',
  '  <Card.Header>',
  '    <Card.Title level={3}>カードのタイトル</Card.Title>',
  '  </Card.Header>',
  '  <Card.Body>本文</Card.Body>',
  '</Card>',
  '```',
].join('\n');

const meta = {
  title: 'Components/Card',
  component: Card,
  subcomponents: {
    'Card.Image': Card.Image,
    'Card.Header': Card.Header,
    'Card.Title': Card.Title,
    'Card.Action': Card.Action,
    'Card.Body': Card.Body,
    'Card.Footer': Card.Footer,
  },
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: docsDescription,
      },
    },
  },
  args: {
    size: 'md',
  },
  render: (args) => (
    <Frame>
      <Card {...args}>
        <Image />
        <Header />
        <Body />
        <Footer />
      </Card>
    </Frame>
  ),
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};

export const SizeSm: Story = {
  args: {
    size: 'sm',
  },
};

export const NotImage: Story = {
  render: (args) => (
    <Frame>
      <Card {...args}>
        <Header />
        <Body />
        <Footer />
      </Card>
    </Frame>
  ),
};

export const NotAction: Story = {
  render: (args) => (
    <Frame>
      <Card {...args}>
        <Card.Header>
          <Card.Title>Card title</Card.Title>
        </Card.Header>
        <Body />
        <Footer />
      </Card>
    </Frame>
  ),
};

/**
 * Card.Title を置かず Card.Action だけを配置した場合。
 * slot props の頃と違い、タイトルの有無に依存せず右端に表示される
 */
export const ActionOnly: Story = {
  render: (args) => (
    <Frame>
      <Card {...args}>
        <Card.Header>
          <Card.Action>
            <MoreLink />
          </Card.Action>
        </Card.Header>
        <Body />
      </Card>
    </Frame>
  ),
};

export const NotHeader: Story = {
  render: (args) => (
    <Frame>
      <Card {...args}>
        <Body />
        <Footer />
      </Card>
    </Frame>
  ),
};

export const Simple: Story = {
  render: (args) => (
    <Frame>
      <Card {...args}>
        <Body />
      </Card>
    </Frame>
  ),
};

/**
 * タイトルは 1 行で省略し、本文は分割できない長い語も折り返すことの確認用
 */
export const LongContent: Story = {
  render: (args) => (
    <Frame>
      <Card {...args}>
        <Card.Header>
          <Card.Title>非常に長いカードタイトルが指定された場合の表示確認用テキスト</Card.Title>
          <Card.Action>
            <MoreLink />
          </Card.Action>
        </Card.Header>
        <Card.Body>
          <p style={{ margin: 0, lineHeight: 1.5 }}>
            https://example.com/very/long/path/that/cannot/be/broken/1234567890
          </p>
        </Card.Body>
      </Card>
    </Frame>
  ),
};

/**
 * `Card.Title` に `level` を指定して見出しとして描画した場合。
 * 周囲の見出し階層（ここでは `h2`）の 1 つ下に合わせている
 */
export const HeadingTitle: Story = {
  render: (args) => (
    <Frame>
      <h2 style={{ margin: '0 0 12px', fontSize: '1.125rem' }}>おすすめ</h2>

      <Card {...args}>
        <Card.Header>
          <Card.Title level={3}>Card title</Card.Title>
          <Card.Action>
            <MoreLink />
          </Card.Action>
        </Card.Header>
        <Body />
      </Card>
    </Frame>
  ),
};

export const AllVariants: Story = {
  render: () => {
    const columnStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      width: '300px',
    };

    const sizes = ['md', 'sm'] as const;

    return (
      <div style={{ display: 'flex', gap: '24px' }}>
        {sizes.map((size) => (
          <div style={columnStyle} key={size}>
            <h4>size = {size}</h4>

            <Card size={size}>
              <Image />
              <Header />
              <Body />
              <Footer />
            </Card>

            <Card size={size}>
              <Header />
              <Body />
              <Footer />
            </Card>

            <Card size={size}>
              <Card.Header>
                <Card.Title>Card title</Card.Title>
              </Card.Header>
              <Body />
              <Footer />
            </Card>

            <Card size={size}>
              <Body />
              <Footer />
            </Card>

            <Card size={size}>
              <Body />
            </Card>
          </div>
        ))}
      </div>
    );
  },
};
