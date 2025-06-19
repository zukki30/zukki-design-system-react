import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { Tag } from './Tag';

const meta = {
  title: 'Components/Tag',
  component: Tag,
  tags: ['autodocs'],
  render: (args) => {
    const buttonGroupStyle = { display: 'flex', alignItems: 'center', gap: '20px' };

    return (
      <div>
        <h4>Default</h4>
        <div style={buttonGroupStyle}>
          <Tag {...args} variant="default" />
        </div>

        <h4>Red</h4>
        <div style={buttonGroupStyle}>
          <Tag {...args} variant="red" />
        </div>

        <h4>Blue</h4>
        <div style={buttonGroupStyle}>
          <Tag {...args} variant="blue" />
        </div>

        <h4>Green</h4>
        <div style={buttonGroupStyle}>
          <Tag {...args} variant="green" />
        </div>

        <h4>Yellow</h4>
        <div style={buttonGroupStyle}>
          <Tag {...args} variant="yellow" />
        </div>

        <h4>Profile</h4>
        <div style={buttonGroupStyle}>
          <Tag {...args} variant="profile" />
        </div>

        <h4>Works</h4>
        <div style={buttonGroupStyle}>
          <Tag {...args} variant="works" />
        </div>

        <h4>Outputs</h4>
        <div style={buttonGroupStyle}>
          <Tag {...args} variant="outputs" />
        </div>
      </div>
    );
  },
} satisfies Meta<typeof Tag>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  label: 'Tab label タグラベル',
};

export const Default: Story = {
  args: defaultArgs,
};

export const CloseButton: Story = {
  args: {
    ...defaultArgs,
    onClose: fn(),
  },
};
