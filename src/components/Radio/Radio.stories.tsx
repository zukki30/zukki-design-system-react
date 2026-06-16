import type { Meta, StoryObj } from '@storybook/react-vite';

import { Radio } from './Radio';

const LABEL = 'サンプルテキストサンプルテキストサンプルテキスト';

const meta = {
  title: 'Components/Radio',
  component: Radio,
  tags: ['autodocs'],
  args: {
    children: LABEL,
    name: 'sample',
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
        <Radio {...args} />
        <Radio {...args} defaultChecked />
        <Radio {...args} disabled />
        <Radio {...args} disabled defaultChecked name="sample-disabled" />
      </div>
    );
  },
} satisfies Meta<typeof Radio>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <Radio {...args} />,
};

export const Checked: Story = {
  args: {
    defaultChecked: true,
  },
  render: (args) => <Radio {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <Radio {...args} />,
};

export const CheckedDisabled: Story = {
  args: {
    disabled: true,
    defaultChecked: true,
  },
  render: (args) => <Radio {...args} />,
};

export const Group: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '300px' }}>
      <Radio {...args} name="fruit" value="apple" defaultChecked>
        りんご
      </Radio>
      <Radio {...args} name="fruit" value="orange">
        みかん
      </Radio>
      <Radio {...args} name="fruit" value="grape">
        ぶどう
      </Radio>
    </div>
  ),
};

export const WithoutLabel: Story = {
  args: {
    children: undefined,
    'aria-label': 'ラジオボタン',
  },
  render: (args) => <Radio {...args} />,
};
