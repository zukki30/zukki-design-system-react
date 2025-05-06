import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';

import { Icon } from '../Icon';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  args: { onClick: fn() },
  render: (args) => {
    const buttonGroupStyle = { display: 'flex', alignItems: 'center', gap: '20px' };

    return (
      <div>
        <h4>Default</h4>
        <div style={buttonGroupStyle}>
          <Button {...args} size="md" variant="default" />
          <Button {...args} size="sm" variant="default" />
        </div>

        <h4>Primary</h4>
        <div style={buttonGroupStyle}>
          <Button {...args} size="md" variant="primary" />
          <Button {...args} size="sm" variant="primary" />
        </div>

        <h4>Secondary</h4>
        <div style={buttonGroupStyle}>
          <Button {...args} size="md" variant="secondary" />
          <Button {...args} size="sm" variant="secondary" />
        </div>

        <h4>Success</h4>
        <div style={buttonGroupStyle}>
          <Button {...args} size="md" variant="success" />
          <Button {...args} size="sm" variant="success" />
        </div>

        <h4>Failure</h4>
        <div style={buttonGroupStyle}>
          <Button {...args} size="md" variant="failure" />
          <Button {...args} size="sm" variant="failure" />
        </div>

        <h4>Profile</h4>
        <div style={buttonGroupStyle}>
          <Button {...args} size="md" variant="profile" />
          <Button {...args} size="sm" variant="profile" />
        </div>

        <h4>Works</h4>
        <div style={buttonGroupStyle}>
          <Button {...args} size="md" variant="works" />
          <Button {...args} size="sm" variant="works" />
        </div>

        <h4>Outputs</h4>
        <div style={buttonGroupStyle}>
          <Button {...args} size="md" variant="outputs" />
          <Button {...args} size="sm" variant="outputs" />
        </div>
      </div>
    );
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

const defaultArgs = {
  children: 'Button',
};

export const Default: Story = {
  args: defaultArgs,
};

export const StartIcon: Story = {
  args: {
    ...defaultArgs,
    startIcon: <Icon name="home" />,
  },
};

export const EndIcon: Story = {
  args: {
    ...defaultArgs,
    endIcon: <Icon name="close" />,
  },
};

export const StartIconAndEndIcon: Story = {
  args: {
    ...defaultArgs,
    startIcon: <Icon name="home" />,
    endIcon: <Icon name="close" />,
  },
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
