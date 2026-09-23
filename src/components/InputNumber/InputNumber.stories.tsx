import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, within } from 'storybook/test';

import { InputNumber } from './InputNumber';

/** WCAG 2.2 SC 2.5.8 Target Size (Minimum) の下限 */
const MIN_TARGET_SIZE = 24;

/**
 * スピンボタンの実寸が 2.5.8 を満たすことを確かめる。
 *
 * axe-core は target size を検査しないため、ここで測る。
 * jsdom はレイアウトしないので、ブラウザで動く test:a11y 側でしか確認できない
 */
const expectSpinButtonTargetSize = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);

  for (const label of ['減らす', '増やす']) {
    const { width, height } = canvas.getByLabelText(label).getBoundingClientRect();

    await expect(width).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
    await expect(height).toBeGreaterThanOrEqual(MIN_TARGET_SIZE);
  }
};

const meta = {
  title: 'Components/InputNumber',
  component: InputNumber,
  tags: ['autodocs'],
  args: {
    placeholder: '0',
  },
  render: (args) => {
    const groupStyle = {
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '8px',
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={groupStyle}>
          <h4>Default</h4>
          <InputNumber {...args} />
        </div>

        <div style={groupStyle}>
          <h4>Default value</h4>
          <InputNumber {...args} defaultValue={1000000000} />
        </div>

        <div style={groupStyle}>
          <h4>Disabled</h4>
          <InputNumber {...args} disabled defaultValue={100} />
        </div>

        <div style={groupStyle}>
          <h4>Error</h4>
          <InputNumber {...args} error defaultValue={186} />
        </div>

        <div style={groupStyle}>
          <h4>With min / max / step</h4>
          <InputNumber {...args} defaultValue={0} min={0} max={10} step={2} />
        </div>
      </div>
    );
  },
} satisfies Meta<typeof InputNumber>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => <InputNumber {...args} />,
  play: ({ canvasElement }) => expectSpinButtonTargetSize(canvasElement),
};

export const DefaultValue: Story = {
  args: {
    defaultValue: 1000000000,
  },
  render: (args) => <InputNumber {...args} />,
};

export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 100,
  },
  render: (args) => <InputNumber {...args} />,
};

export const Error: Story = {
  args: {
    error: true,
    defaultValue: 186,
  },
  render: (args) => <InputNumber {...args} />,
};

export const SizeSm: Story = {
  args: {
    size: 'sm',
    defaultValue: 186,
  },
  render: (args) => <InputNumber {...args} />,
  play: ({ canvasElement }) => expectSpinButtonTargetSize(canvasElement),
};
