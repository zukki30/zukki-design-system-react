import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { StepsItem } from './StepsItem';

const meta = {
  title: 'Components/Steps/StepsItem',
  component: StepsItem,
  tags: ['autodocs'],
} satisfies Meta<typeof StepsItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    stepNumber: 1,
    label: 'Step 1 Label',
  },
};

export const Current: Story = {
  args: {
    stepNumber: 1,
    label: 'Step 1 Label',
    current: true,
  },
};

export const Finished: Story = {
  args: {
    stepNumber: 2,
    label: 'Step 2 Label',
    finished: true,
  },
};

export const DefaultClickable: Story = {
  args: {
    stepNumber: 3,
    label: 'Step 3 Label',
    onClick: fn(),
  },
};

export const CurrentClickable: Story = {
  args: {
    stepNumber: 4,
    label: 'Step 4 Label',
    current: true,
    onClick: fn(),
  },
};
