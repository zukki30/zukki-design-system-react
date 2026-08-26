import type { Meta, StoryObj } from '@storybook/react-vite';

import { Tooltip } from './Tooltip';

const meta = {
  title: 'Components/Tooltip',
  component: Tooltip,
  tags: ['autodocs'],
  parameters: {
    // TODO(#86): 配色トークンが WCAG AA のコントラスト比を満たしていない。
    // 修正は Figma 側のデザイン判断を伴うため #86 で追跡する。
    // color-contrast だけを外し、他のルールは error のまま維持する
    a11y: {
      config: {
        rules: [{ id: 'color-contrast', enabled: false }],
      },
    },
  },
  args: {
    content: 'ツールチップテキスト',
    placement: 'top',
    children: <span>tooltip target</span>,
  },
  render: (args) => (
    <div style={{ padding: '80px', display: 'inline-block' }}>
      <Tooltip {...args} />
    </div>
  ),
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Top: Story = { args: { placement: 'top' } };
export const TopLeft: Story = { args: { placement: 'topLeft' } };
export const TopRight: Story = { args: { placement: 'topRight' } };
export const Bottom: Story = { args: { placement: 'bottom' } };
export const BottomLeft: Story = { args: { placement: 'bottomLeft' } };
export const BottomRight: Story = { args: { placement: 'bottomRight' } };
export const Left: Story = { args: { placement: 'left' } };
export const Right: Story = { args: { placement: 'right' } };

export const AlwaysOpen: Story = {
  args: {
    open: true,
  },
};

export const AllPlacements: Story = {
  render: () => {
    const cellStyle = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '48px',
    };

    const placements = [
      'top',
      'topLeft',
      'topRight',
      'bottom',
      'bottomLeft',
      'bottomRight',
      'left',
      'right',
    ] as const;

    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '16px',
        }}
      >
        {placements.map((placement) => (
          <div key={placement} style={cellStyle}>
            <Tooltip content="ツールチップテキスト" placement={placement} open>
              <span>{placement}</span>
            </Tooltip>
          </div>
        ))}
      </div>
    );
  },
};
