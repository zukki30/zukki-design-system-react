import type { Meta, StoryObj } from '@storybook/react-vite';
import { Skeleton } from './Skeleton';

const meta = {
  title: 'Components/Skeleton',
  component: Skeleton,
  tags: ['autodocs'],
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Size: Story = {
  args: {
    width: '100px',
    height: '100px',
  },
};

export const Circle: Story = {
  args: {
    width: '100px',
    height: '100px',
    shape: 'circle',
  },
};
