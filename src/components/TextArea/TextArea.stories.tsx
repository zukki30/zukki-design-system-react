import type { Meta, StoryObj } from '@storybook/react-vite';

import { TextArea } from './TextArea';

const SAMPLE_TEXT =
  'サンプルテキストサンプルテキスト\nサンプルテキストサンプルテキストサンプルテキスト\nサンプルテキスト';

const meta = {
  title: 'Components/TextArea',
  component: TextArea,
  tags: ['autodocs'],
  args: {
    placeholder: 'placeholder',
  },
  render: (args) => {
    const groupStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
      width: '380px',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={groupStyle}>
          <h4>Default</h4>
          <TextArea {...args} />
        </div>

        <div style={groupStyle}>
          <h4>Default value</h4>
          <TextArea {...args} defaultValue={SAMPLE_TEXT} />
        </div>

        <div style={groupStyle}>
          <h4>Disabled</h4>
          <TextArea {...args} disabled defaultValue="disabled" />
        </div>

        <div style={groupStyle}>
          <h4>Error</h4>
          <TextArea {...args} error defaultValue="error" />
        </div>
      </div>
    );
  },
} satisfies Meta<typeof TextArea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DefaultValue: Story = {
  args: {
    defaultValue: SAMPLE_TEXT,
  },
  render: (args) => <TextArea {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 'disabled',
  },
  render: (args) => <TextArea {...args} />,
};

export const Error: Story = {
  args: {
    error: true,
    defaultValue: 'error',
  },
  render: (args) => <TextArea {...args} />,
};
