import type { Meta, StoryObj } from '@storybook/react-vite';

import { Input } from '../Input';

import { FormField } from './FormField';

const meta = {
  title: 'Components/FormField',
  component: FormField,
  tags: ['autodocs'],
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
