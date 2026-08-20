import type { Meta, StoryObj } from '@storybook/react-vite';
import { fn } from 'storybook/test';

import { Steps } from './Steps';

/**
 * Steps の直下には Steps.Item だけを置く必要があるため、
 * Fragment ではなく配列でまとめて渡す
 */
const stepItems = (labels: string[]) =>
  // ラベルは重複しうるため key にできない。ステップの同一性は並び順そのものなので index を使う
  labels.map((label, index) => <Steps.Item key={index}>{label}</Steps.Item>);

const meta = {
  title: 'Components/Steps',
  component: Steps,
  tags: ['autodocs'],
  args: {
    onClick: fn(),
    current: 1,
    children: stepItems(['入力', '確認', '完了']),
  },
} satisfies Meta<typeof Steps>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Vertical: Story = {
  args: {
    current: 2,
    orientation: 'vertical',
  },
};

/**
 * onClick を渡さない場合はボタンではなく非インタラクティブな要素として描画される
 */
export const NotClickable: Story = {
  args: {
    current: 2,
    onClick: undefined,
  },
};

/**
 * 幅の狭い親に置いたときのラベルの扱いの確認用。
 * 横並びはステップ同士が幅を奪い合うため 1 行で省略し、縦並びは余裕があるため折り返す
 */
export const LongLabel: Story = {
  args: {
    current: 2,
    children: stepItems([
      '配送先の住所を入力する',
      'お支払い方法を選択する',
      'ご注文内容を確認する',
    ]),
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
