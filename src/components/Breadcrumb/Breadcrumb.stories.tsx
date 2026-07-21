import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from '../Icon';

import { Breadcrumb } from './Breadcrumb';

const items = [
  { label: 'HOME', href: '#', icon: <Icon name="home" width={20} height={20} /> },
  { label: '下層1ページ目', href: '#' },
  { label: '下層1ページ目' },
];

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  args: {
    items,
    variant: 'default',
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Profile: Story = {
  args: {
    variant: 'profile',
  },
};

export const Works: Story = {
  args: {
    variant: 'works',
  },
};

export const Outputs: Story = {
  args: {
    variant: 'outputs',
  },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Breadcrumb items={items} variant="default" />
      <Breadcrumb items={items} variant="profile" />
      <Breadcrumb items={items} variant="works" />
      <Breadcrumb items={items} variant="outputs" />
    </div>
  ),
};
