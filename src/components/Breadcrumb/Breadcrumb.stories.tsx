import type { Meta, StoryObj } from '@storybook/react-vite';

import { Icon } from '../Icon';

import { Breadcrumb } from './Breadcrumb';

const items = [
  { label: 'HOME', href: '#', icon: <Icon name="home" width={20} height={20} /> },
  { label: '下層1ページ目', href: '#' },
  { label: '下層1ページ目' },
];

const meta = {
  title: 'Components/Breadcrumb',
  component: Breadcrumb,
  tags: ['autodocs'],
  args: {
    items,
    variant: 'default',
  },
} satisfies Meta<typeof Breadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Profile: Story = {
  args: {
    variant: 'profile',
  },
};

export const Works: Story = {
  args: {
    variant: 'works',
  },
};

export const Outputs: Story = {
  args: {
    variant: 'outputs',
  },
};

/**
 * 幅の狭い親に置いたときに、アイコンと区切りを潰さずラベル側が省略されることの確認用
 */
export const LongLabel: Story = {
  args: {
    items: [
      { label: 'HOME', href: '#', icon: <Icon name="home" width={20} height={20} /> },
      { label: '非常に長い中間ページのラベルが指定された場合', href: '#' },
      { label: '非常に長い現在地のラベルが指定された場合' },
    ],
  },
  render: (args) => (
    <div style={{ width: '320px', padding: '8px', border: '1px dashed #a6aab3' }}>
      <Breadcrumb {...args} />
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* nav ランドマークは同一ページ内で名前が重複してはいけない。
          1 ページに 1 つが本来の使い方だが、並べて見せるストーリーでは名前を振り分ける */}
      <Breadcrumb items={items} variant="default" aria-label="パンくずリスト（default）" />
      <Breadcrumb items={items} variant="profile" aria-label="パンくずリスト（profile）" />
      <Breadcrumb items={items} variant="works" aria-label="パンくずリスト（works）" />
      <Breadcrumb items={items} variant="outputs" aria-label="パンくずリスト（outputs）" />
    </div>
  ),
};
