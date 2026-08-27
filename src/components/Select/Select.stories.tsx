import type { Meta, StoryObj } from '@storybook/react-vite';

import { Select } from './Select';

const options = (
  <>
    <option value="default">default</option>
    <option value="hover">hover</option>
    <option value="selected">selected</option>
    <option value="disabled" disabled>
      disabled
    </option>
  </>
);

const meta = {
  title: 'Components/Select',
  component: Select,
  tags: ['autodocs'],
  args: {
    placeholder: 'placeholder',
    children: options,
    // 単体で使うときのアクセシブルな名前は利用側が与える。
    // FormField の中に置く場合は label と紐付くため不要
    'aria-label': '項目を選択',
  },
  render: (args) => {
    const groupStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      width: '240px',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={groupStyle}>
          <h4>Placeholder</h4>
          <Select {...args} />
        </div>

        <div style={groupStyle}>
          <h4>Default value</h4>
          <Select {...args} defaultValue="selected" />
        </div>

        <div style={groupStyle}>
          <h4>Disabled</h4>
          <Select {...args} disabled />
        </div>

        <div style={groupStyle}>
          <h4>Error</h4>
          <Select {...args} error />
        </div>
      </div>
    );
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Placeholder: Story = {
  render: (args) => <Select {...args} />,
};

export const DefaultValue: Story = {
  args: {
    defaultValue: 'selected',
  },
  render: (args) => <Select {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => <Select {...args} />,
};

export const Error: Story = {
  args: {
    error: true,
  },
  render: (args) => <Select {...args} />,
};
