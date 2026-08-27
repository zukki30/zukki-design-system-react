import type { Meta, StoryObj } from '@storybook/react-vite';

import { vars } from '@/styles/theme.css';

import { Spinner } from './Spinner';

const meta = {
  title: 'Components/Spinner',
  component: Spinner,
  parameters: {
    layout: 'centered',
  },
  decorators: [(Story) => <Story />],
  tags: ['autodocs'],
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {
  args: {
    variant: 'light',
    'aria-label': 'Loading Spinner...',
  },
  render: (args) => <Spinner {...args} />,
};

export const Dark: Story = {
  args: {
    variant: 'dark',
    'aria-label': 'Loading Spinner...',
  },
  render: (args) => (
    <div style={{ backgroundColor: '#999', padding: '12px' }}>
      <Spinner {...args} />
    </div>
  ),
};

export const Primary: Story = {
  args: {
    variant: 'primary',
    'aria-label': 'Loading Spinner...',
  },
  render: (args) => <Spinner {...args} />,
};

/**
 * 意味カラーの塗りに重ねるバリアント。Button の loading で使われる
 */
export const Accent: Story = {
  args: {
    variant: 'accent',
    'aria-label': 'Loading Spinner...',
  },
  render: (args) => (
    <div style={{ backgroundColor: vars.color.primary.default, padding: '12px' }}>
      <Spinner {...args} />
    </div>
  ),
};
