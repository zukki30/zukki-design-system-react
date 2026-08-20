import type { Meta, StoryObj } from '@storybook/react-vite';

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

const ImagePlaceholder = () => (
  <div style={{ height: '140px', width: '100%', backgroundColor: '#d9d9d9' }} />
);

const BodyText = () => (
  <div>
    <p style={{ margin: 0, lineHeight: 1.5 }}>Card simple text</p>
    <p style={{ margin: 0, lineHeight: 1.5 }}>Card simple</p>
  </div>
);

const meta = {
  title: 'Components/Card',
  component: Card,
  tags: ['autodocs'],
  args: {
    size: 'md',
  },
  render: (args) => (
    <div style={{ width: '300px' }}>
      <Card {...args}>
        <Card.Image>
          <ImagePlaceholder />
        </Card.Image>
        <Card.Header>
          <Card.Title>Card title</Card.Title>
          <Card.Action>
            <MoreLink />
          </Card.Action>
        </Card.Header>
        <Card.Body>
          <BodyText />
        </Card.Body>
        <Card.Footer>
          <MoreLink />
        </Card.Footer>
      </Card>
    </div>
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
    <div style={{ width: '300px' }}>
      <Card {...args}>
        <Card.Header>
          <Card.Title>Card title</Card.Title>
          <Card.Action>
            <MoreLink />
          </Card.Action>
        </Card.Header>
        <Card.Body>
          <BodyText />
        </Card.Body>
        <Card.Footer>
          <MoreLink />
        </Card.Footer>
      </Card>
    </div>
  ),
};

export const NotAction: Story = {
  render: (args) => (
    <div style={{ width: '300px' }}>
      <Card {...args}>
        <Card.Header>
          <Card.Title>Card title</Card.Title>
        </Card.Header>
        <Card.Body>
          <BodyText />
        </Card.Body>
        <Card.Footer>
          <MoreLink />
        </Card.Footer>
      </Card>
    </div>
  ),
};

/**
 * Card.Title を置かず Card.Action だけを配置した場合。
 * slot props の頃と違い、タイトルの有無に依存せず右端に表示される
 */
export const ActionOnly: Story = {
  render: (args) => (
    <div style={{ width: '300px' }}>
      <Card {...args}>
        <Card.Header>
          <Card.Action>
            <MoreLink />
          </Card.Action>
        </Card.Header>
        <Card.Body>
          <BodyText />
        </Card.Body>
      </Card>
    </div>
  ),
};

export const NotHeader: Story = {
  render: (args) => (
    <div style={{ width: '300px' }}>
      <Card {...args}>
        <Card.Body>
          <BodyText />
        </Card.Body>
        <Card.Footer>
          <MoreLink />
        </Card.Footer>
      </Card>
    </div>
  ),
};

export const Simple: Story = {
  render: (args) => (
    <div style={{ width: '300px' }}>
      <Card {...args}>
        <Card.Body>
          <BodyText />
        </Card.Body>
      </Card>
    </div>
  ),
};

/**
 * タイトルは 1 行で省略し、本文は分割できない長い語も折り返すことの確認用
 */
export const LongContent: Story = {
  render: (args) => (
    <div style={{ width: '300px' }}>
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
    </div>
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
              <Card.Image>
                <ImagePlaceholder />
              </Card.Image>
              <Card.Header>
                <Card.Title>Card title</Card.Title>
                <Card.Action>
                  <MoreLink />
                </Card.Action>
              </Card.Header>
              <Card.Body>
                <BodyText />
              </Card.Body>
              <Card.Footer>
                <MoreLink />
              </Card.Footer>
            </Card>

            <Card size={size}>
              <Card.Header>
                <Card.Title>Card title</Card.Title>
                <Card.Action>
                  <MoreLink />
                </Card.Action>
              </Card.Header>
              <Card.Body>
                <BodyText />
              </Card.Body>
              <Card.Footer>
                <MoreLink />
              </Card.Footer>
            </Card>

            <Card size={size}>
              <Card.Header>
                <Card.Title>Card title</Card.Title>
              </Card.Header>
              <Card.Body>
                <BodyText />
              </Card.Body>
              <Card.Footer>
                <MoreLink />
              </Card.Footer>
            </Card>

            <Card size={size}>
              <Card.Body>
                <BodyText />
              </Card.Body>
              <Card.Footer>
                <MoreLink />
              </Card.Footer>
            </Card>

            <Card size={size}>
              <Card.Body>
                <BodyText />
              </Card.Body>
            </Card>
          </div>
        ))}
      </div>
    );
  },
};
