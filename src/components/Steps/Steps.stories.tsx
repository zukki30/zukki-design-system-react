import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';
import { Steps } from './Steps';

const meta = {
  title: 'Components/Steps/Steps',
  component: Steps,
  tags: ['autodocs'],
  args: { onClick: fn() },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    labels: ['入力', '確認', '完了'],
    current: 1,
  },
};

export const Vertical: Story = {
  args: {
    labels: ['入力', '確認', '完了'],
    current: 2,
    vertical: true,
  },
};

/**
 * 幅の狭い親に置いたときに、番号アイコンを潰さずラベル側が省略されることの確認用
 */
export const LongLabel: Story = {
  args: {
    labels: ['配送先の住所を入力する', 'お支払い方法を選択する', 'ご注文内容を確認する'],
    current: 2,
  },
  render: (args) => (
    <div style={{ width: '420px', padding: '8px', border: '1px dashed #a6aab3' }}>
      <Steps {...args} />
    </div>
  ),
};
