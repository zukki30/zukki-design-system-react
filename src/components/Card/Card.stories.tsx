import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ReactNode } from 'react';

import { Card } from './Card';

const moreLinkStyle = {
  color: 'var(--color\\/textonlink\\/default, #0e70f1)',
  fontWeight: 700,
  fontSize: '0.875rem',
  textDecoration: 'underline',
};

const MoreLink = () => (
  <a href="#" style={moreLinkStyle}>
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

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
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
