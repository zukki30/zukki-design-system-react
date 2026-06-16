import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from './Checkbox';

const LABEL = 'サンプルテキストサンプルテキストサンプルテキスト';

const meta = {
  title: 'Components/Checkbox',
  component: Checkbox,
  tags: ['autodocs'],
  args: {
    children: LABEL,
  },
  render: (args) => {
    const groupStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '16px',
      width: '300px',
    };

    return (
      <div style={groupStyle}>
        <Checkbox {...args} />
        <Checkbox {...args} defaultChecked />
        <Checkbox {...args} indeterminate />
        <Checkbox {...args} disabled />
        <Checkbox {...args} disabled defaultChecked />
      </div>
    );
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Checkbox {...args} />,
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const Indeterminate: Story = {
  args: {
    indeterminate: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const CheckedDisabled: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
  render: (args) => <Checkbox {...args} />,
};

export const WithoutLabel: Story = {
  args: {
    children: undefined,
    'aria-label': 'チェックボックス',
  },
  render: (args) => <Checkbox {...args} />,
};
