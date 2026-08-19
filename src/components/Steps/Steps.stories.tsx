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
    orientation: 'vertical',
  },
};

/**
 * 幅の狭い親に置いたときのラベルの扱いの確認用。
 * 横並びはステップ同士が幅を奪い合うため 1 行で省略し、縦並びは余裕があるため折り返す
 */
export const LongLabel: Story = {
  args: {
    labels: ['配送先の住所を入力する', 'お支払い方法を選択する', 'ご注文内容を確認する'],
    current: 2,
  },
  render: (args) => {
    const boxStyle = { padding: '8px', border: '1px dashed #a6aab3' };

    return (
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
        <div style={{ ...boxStyle, width: '420px' }}>
          <h4>horizontal（1 行で省略）</h4>
          <Steps {...args} />
        </div>

        <div style={{ ...boxStyle, width: '180px' }}>
          <h4>vertical（折り返し）</h4>
          <Steps {...args} orientation="vertical" />
        </div>
      </div>
    );
  },
};
