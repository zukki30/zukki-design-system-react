import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { Icon } from '../Icon';
import { IconButton } from './IconButton';

const meta = {
  title: 'Components/IconButton',
  component: IconButton,
  tags: ['autodocs'],
  args: { onClick: fn() },
  render: (args) => {
    const buttonGroupStyle = { display: 'flex', alignItems: 'center', gap: '20px' };

    return (
      <div>
        <h4>Primary</h4>
        <div style={buttonGroupStyle}>
          <IconButton {...args} size="md" variant="primary" />
          <IconButton {...args} size="sm" variant="primary" />
        </div>

        <h4>Secondary</h4>
        <div style={buttonGroupStyle}>
          <IconButton {...args} size="md" variant="secondary" />
          <IconButton {...args} size="sm" variant="secondary" />
        </div>

        <h4>Primary Exposed</h4>
        <div style={buttonGroupStyle}>
          <IconButton {...args} size="md" variant="primary-exposed" />
          <IconButton {...args} size="sm" variant="primary-exposed" />
        </div>

        <h4>Secondary Exposed</h4>
        <div style={buttonGroupStyle}>
          <IconButton {...args} size="md" variant="secondary-exposed" />
          <IconButton {...args} size="sm" variant="secondary-exposed" />
        </div>
      </div>
    );
  },
} satisfies Meta<typeof IconButton>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  children: <Icon name="home" width={16} height={16} />,
};

export const Default: Story = {
  args: defaultArgs,
};

export const Selected: Story = {
  args: {
    ...defaultArgs,
    selected: true,
  },
};

export const Disabled: Story = {
  args: {
    ...defaultArgs,
    disabled: true,
  },
};

export const Loading: Story = {
  args: {
    ...defaultArgs,
    loading: true,
  },
};
