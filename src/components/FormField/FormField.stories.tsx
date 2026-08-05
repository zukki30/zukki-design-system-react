import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '../Input';

import { FormField } from './FormField';

const docsDescription = [
  'ラベル・補助テキスト・エラーメッセージをまとめて扱うフォームフィールドです。',
  '',
  '### 入力要素との自動的な紐付け',
  '',
  'children が **単一の要素** のとき、次の属性を自動で注入します。利用側で id を書く必要はありません。',
  '',
  '| 属性 | 内容 |',
  '| --- | --- |',
  '| `id` | `htmlFor` → children の `id` → 自動生成（`useId`）の順に決まり、label の `for` と一致する |',
  '| `aria-describedby` | `helperText` / `errorText` の id。children が指定済みの値があれば結合する |',
  '| `aria-required` | `required` のとき `true`。children が指定済みならそちらを優先する |',
  '',
  '`errorText` には `role="alert"` を付与しているため、表示された時点で支援技術に通知されます。',
  '',
  'children が複数要素・テキストの場合は注入を行いません。その場合は `htmlFor` と入力要素の `id` を',
  '明示的に指定してください。',
  '',
  '### 伝播しないもの',
  '',
  '`error`（`aria-invalid`）と `disabled` は入力要素へ伝播しません。`errorText` を表示するときは',
  '`<Input error>` のように入力要素側にも状態を指定してください。',
].join('\n');

const meta = {
  title: 'Components/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: docsDescription,
      },
    },
  },
  args: {
    label: 'ラベル',
    children: <Input placeholder="placeholder" />,
  },
  render: (args) => (
    <div style={{ width: '320px' }}>
      <FormField {...args} />
    </div>
  ),
} satisfies Meta<typeof FormField>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    orientation: 'horizontal',
  },
};

export const Vertical: Story = {
  args: {
    orientation: 'vertical',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: <Input placeholder="Disabled入力" disabled />,
  },
};

export const RequiredBadge: Story = {
  args: {
    required: true,
    requiredMark: 'badge',
  },
};

export const RequiredAsterisk: Story = {
  args: {
    required: true,
    requiredMark: 'asterisk',
  },
};

export const ErrorText: Story = {
  args: {
    required: true,
    requiredMark: 'both',
    children: <Input placeholder="placeholder" error />,
    errorText: (
      <>
        Error メッセージError メッセージ
        <br />
        Error メッセージ
      </>
    ),
  },
};

export const HelperText: Story = {
  args: {
    required: true,
    requiredMark: 'both',
    helperText: (
      <>
        Helper テキストHelper テキスト
        <br />
        Helper テキスト
      </>
    ),
  },
};

export const HelperAndError: Story = {
  args: {
    required: true,
    requiredMark: 'both',
    children: <Input placeholder="placeholder" error />,
    helperText: (
      <>
        Helper テキストHelper テキスト
        <br />
        Helper テキスト
      </>
    ),
    errorText: (
      <>
        Error メッセージError メッセージ
        <br />
        Error メッセージ
      </>
    ),
  },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '320px' }}>
      <FormField label="ラベル" orientation="horizontal">
        <Input placeholder="placeholder" />
      </FormField>

      <FormField label="ラベル" orientation="vertical">
        <Input placeholder="placeholder" />
      </FormField>

      <FormField label="ラベル" disabled>
        <Input placeholder="Disabled入力" disabled />
      </FormField>

      <FormField label="ラベル" required requiredMark="badge">
        <Input placeholder="placeholder" />
      </FormField>

      <FormField label="ラベル" required requiredMark="asterisk">
        <Input placeholder="placeholder" />
      </FormField>

      <FormField
        label="ラベル"
        required
        requiredMark="both"
        errorText={
          <>
            Error メッセージError メッセージ
            <br />
            Error メッセージ
          </>
        }
      >
        <Input placeholder="placeholder" error />
      </FormField>

      <FormField
        label="ラベル"
        required
        requiredMark="both"
        helperText={
          <>
            Helper テキストHelper テキスト
            <br />
            Helper テキスト
          </>
        }
      >
        <Input placeholder="placeholder" />
      </FormField>

      <FormField
        label="ラベル"
        required
        requiredMark="both"
        helperText={
          <>
            Helper テキストHelper テキスト
            <br />
            Helper テキスト
          </>
        }
        errorText={
          <>
            Error メッセージError メッセージ
            <br />
            Error メッセージ
          </>
        }
      >
        <Input placeholder="placeholder" error />
      </FormField>
    </div>
  ),
};
