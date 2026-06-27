import type { Meta, StoryObj } from '@storybook/react-vite';

import { Switch } from './Switch';

const LABEL = 'サンプルテキストサンプルテキストサンプルテキスト';

const meta = {
  title: 'Components/Switch',
  component: Switch,
  tags: ['autodocs'],
  args: {
    children: LABEL,
  },
  render: (args) => {
    const groupStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      width: '320px',
    };

    return (
      <div style={groupStyle}>
        <Switch {...args} />
        <Switch {...args} defaultChecked />
        <Switch {...args} disabled />
        <Switch {...args} disabled defaultChecked />
      </div>
    );
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Switch {...args} />,
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  render: (args) => <Switch {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <Switch {...args} />,
};

export const CheckedDisabled: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
  render: (args) => <Switch {...args} />,
};

export const WithoutLabel: Story = {
  args: {
    children: undefined,
    'aria-label': 'スイッチ',
  },
  render: (args) => <Switch {...args} />,
};
