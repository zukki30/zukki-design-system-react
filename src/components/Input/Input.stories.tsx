import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from '../Icon';

import { Input } from './Input';

const meta = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  args: {
    placeholder: 'placeholder',
  },
  render: (args) => {
    const groupStyle = { display: 'flex', flexDirection: 'column' as const, gap: '8px', width: '240px' };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={groupStyle}>
          <h4>Default</h4>
          <Input {...args} />
        </div>

        <div style={groupStyle}>
          <h4>Default value</h4>
          <Input {...args} defaultValue="サンプルテキスト" />
        </div>

        <div style={groupStyle}>
          <h4>Disabled</h4>
          <Input {...args} disabled defaultValue="Disabled入力" />
        </div>

        <div style={groupStyle}>
          <h4>Error</h4>
          <Input {...args} error defaultValue="エラー入力" />
        </div>

        <div style={groupStyle}>
          <h4>Start icon</h4>
          <Input {...args} startIcon={<Icon name="calendarMonth" />} />
        </div>

        <div style={groupStyle}>
          <h4>End icon</h4>
          <Input {...args} endIcon={<Icon name="calendarMonth" />} />
        </div>
      </div>
    );
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DefaultValue: Story = {
  args: {
    defaultValue: 'サンプルテキスト',
  },
  render: (args) => <Input {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'Disabled入力',
  },
  render: (args) => <Input {...args} />,
};

export const Error: Story = {
  args: {
    error: true,
    defaultValue: 'エラー入力',
  },
  render: (args) => <Input {...args} />,
};

export const StartIcon: Story = {
  args: {
    startIcon: <Icon name="calendarMonth" />,
  },
  render: (args) => <Input {...args} />,
};

export const EndIcon: Story = {
  args: {
    endIcon: <Icon name="calendarMonth" />,
  },
  render: (args) => <Input {...args} />,
};
