import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Steps } from './Steps';

const meta = {
  title: 'Components/Steps/Steps',
  component: Steps,
  tags: ['autodocs'],
  args: { onClick: fn() },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    labels: ['入力', '確認', '完了'],
    current: 1,
  },
};

export const Vertical: Story = {
  args: {
    labels: ['入力', '確認', '完了'],
    current: 2,
    vertical: true,
  },
};
