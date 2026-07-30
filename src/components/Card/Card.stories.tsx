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

const imagePlaceholder = (
  <div style={{ height: '140px', width: '100%', backgroundColor: '#d9d9d9' }} />
);

const bodyText = (
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
    image: imagePlaceholder,
    title: 'Card title',
    action: <MoreLink />,
    footer: <MoreLink />,
    children: bodyText,
  },
  render: (args) => (
    <div style={{ width: '300px' }}>
      <Card {...args} />
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
  args: {
    image: undefined,
  },
};

export const NotMeta: Story = {
  args: {
    action: undefined,
  },
};

export const NotHeader: Story = {
  args: {
    image: undefined,
    title: undefined,
    action: undefined,
  },
};

export const Simple: Story = {
  args: {
    image: undefined,
    title: undefined,
    action: undefined,
    footer: undefined,
  },
};

export const AllVariants: Story = {
  render: () => {
    const columnStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      width: '300px',
    };

    return (
      <div style={{ display: 'flex', gap: '24px' }}>
        <div style={columnStyle}>
          <h4>size = md</h4>
          <Card
            image={imagePlaceholder}
            title="Card title"
            action={<MoreLink />}
            footer={<MoreLink />}
          >
            {bodyText}
          </Card>
          <Card title="Card title" action={<MoreLink />} footer={<MoreLink />}>
            {bodyText}
          </Card>
          <Card title="Card title" footer={<MoreLink />}>
            {bodyText}
          </Card>
          <Card footer={<MoreLink />}>{bodyText}</Card>
          <Card>{bodyText}</Card>
        </div>

        <div style={columnStyle}>
          <h4>size = sm</h4>
          <Card
            size="sm"
            image={imagePlaceholder}
            title="Card title"
            action={<MoreLink />}
            footer={<MoreLink />}
          >
            {bodyText}
          </Card>
          <Card size="sm" title="Card title" action={<MoreLink />} footer={<MoreLink />}>
            {bodyText}
          </Card>
          <Card size="sm" title="Card title" footer={<MoreLink />}>
            {bodyText}
          </Card>
          <Card size="sm" footer={<MoreLink />}>
            {bodyText}
          </Card>
          <Card size="sm">{bodyText}</Card>
        </div>
      </div>
    );
  },
};
