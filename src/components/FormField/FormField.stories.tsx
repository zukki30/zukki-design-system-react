import type { Meta, StoryObj } from '@storybook/react-vite';

import { Checkbox } from '../Checkbox';
import { Input } from '../Input';

import { FormField } from './FormField';

const docsDescription = [
  'ラベル・補助テキスト・エラーメッセージをまとめて扱うフォームフィールドです。',
  '',
  '中身は `FormField.Label` / `FormField.Control` / `FormField.HelperText` / `FormField.ErrorText`',
  'を合成して組み立てます。各パーツの有無は、描画するかどうかで表現します。',
  '',
  '```tsx',
  '<FormField required>',
  '  <FormField.Label>メールアドレス</FormField.Label>',
  '  <FormField.Control>',
  '    <Input type="email" />',
  '  </FormField.Control>',
  '  <FormField.HelperText>会社のアドレスを入力してください</FormField.HelperText>',
  '  {message !== undefined && <FormField.ErrorText>{message}</FormField.ErrorText>}',
  '</FormField>',
  '```',
  '',
  '### 状態の自動伝播',
  '',
  'ルートで指定した状態は context 経由で入力要素へ伝わります。`<Input error disabled>` のように',
  '入力要素側で指定し直す必要はありません。',
  '',
  '| ルートの指定 | 入力要素に伝わるもの |',
  '| --- | --- |',
  '| `required` | `aria-required`（ラベルには必須マーク） |',
  '| `disabled` | `disabled`（ラベルは disabled 表示） |',
  '| `FormField.ErrorText` の描画 | `error` / `aria-invalid` |',
  '',
  'エラー状態は `FormField.ErrorText` を描画しているかどうかで決まります。',
  'メッセージを出さずにエラー表示だけしたい場合は、ルートに `error` を指定して上書きできます。',
  '',
  '入力要素側で明示した値は常に優先されるため、`<Input disabled={false} />` のように',
  'フィールド単位の状態から外すこともできます。',
  '',
  '### 入力要素との紐付け',
  '',
  '`FormField.Control` の子が **単一の要素** のとき、次の属性を自動で注入します。',
  '利用側で id を書く必要はありません。',
  '',
  '| 属性 | 内容 |',
  '| --- | --- |',
  '| `id` | 子の `id` があればそれを尊重し、無ければ自動生成（`useId`）する |',
  '| `aria-describedby` | 補助テキスト・エラーメッセージの id。子が指定済みの値があれば結合する |',
  '| `aria-required` / `aria-invalid` / `disabled` | ルートの状態。子が指定済みならそちらを優先する |',
  '',
  '`disabled` は、その属性を持てる素の HTML 要素（`<input>` など）とコンポーネントにのみ注入します。',
  '`<div>` のような要素に不正な属性が付くことはありません。',
  '',
  '`FormField.Label` の `htmlFor` は、実際に描画された入力要素の id と自動で紐付きます',
  '（入力要素が無いときは出力しません）。',
  '',
  '子が複数要素・テキスト・単一の Fragment の場合は注入しません（Fragment は props を',
  '受け取れないため）。この場合は入力要素の `id` と `aria-required` を利用側で指定してください。',
  'エラー状態と `disabled` は context 経由で伝わるため、指定は不要です。',
  '',
  'また、ラベルと紐付く入力要素が無いときは、ルートが `role="group"` と `aria-labelledby` を持ち、',
  '`FormField.Label` がグループの名前になります（チェックボックス群など）。',
  '',
  '### id を使う紐付けのタイミング',
  '',
  'ルートからは子孫の描画有無を検査できないため、パーツ側から id を登録してもらっています。',
  '登録は `useEffect` で行うため、`htmlFor` / `aria-describedby` と `FormField.ErrorText` 由来の',
  'エラー状態は初回のコミットでは未反映で、直後の再レンダーで付きます。',
  '初回描画からエラー表示を確定させたい場合は `error` を明示してください。',
  'サーバー描画では effect が走らないため、ハイドレーション前の HTML にこれらは含まれません。',
  '',
  '### レイアウト',
  '',
  '横並びのレイアウトはルートの grid で組んでいます。**パーツはルートの直下に置いてください。**',
  '別の要素で囲むと列の割り当てが崩れます。',
].join('\n');

const meta = {
  title: 'Components/FormField',
  component: FormField,
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
    docs: {
      description: {
        component: docsDescription,
      },
    },
  },
  args: {
    children: (
      <>
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
      </>
    ),
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
    children: (
      <>
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
        <FormField.ErrorText>
          Error メッセージError メッセージ
          <br />
          Error メッセージ
        </FormField.ErrorText>
      </>
    ),
  },
};

export const HelperText: Story = {
  args: {
    required: true,
    requiredMark: 'both',
    children: (
      <>
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
        <FormField.HelperText>
          Helper テキストHelper テキスト
          <br />
          Helper テキスト
        </FormField.HelperText>
      </>
    ),
  },
};

export const HelperAndError: Story = {
  args: {
    required: true,
    requiredMark: 'both',
    children: (
      <>
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
        <FormField.HelperText>
          Helper テキストHelper テキスト
          <br />
          Helper テキスト
        </FormField.HelperText>
        <FormField.ErrorText>
          Error メッセージError メッセージ
          <br />
          Error メッセージ
        </FormField.ErrorText>
      </>
    ),
  },
};

/**
 * 複数の入力要素を並べる例。
 *
 * この場合は id が自動注入されないため、それぞれにラベルを持たせる。
 * `FormField.Label` は個々の入力要素ではなくグループ（`role="group"`）の名前になり、
 * `disabled` は context 経由で全ての入力要素に伝わる
 */
export const MultipleControls: Story = {
  args: {
    orientation: 'vertical',
    disabled: true,
    children: (
      <>
        <FormField.Label>受け取る通知</FormField.Label>
        <FormField.Control>
          <Checkbox defaultChecked>メール</Checkbox>
          <Checkbox>SMS</Checkbox>
        </FormField.Control>
        <FormField.HelperText>あとから設定画面で変更できます</FormField.HelperText>
      </>
    ),
  },
};

export const AllStates: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '320px' }}>
      <FormField orientation="horizontal">
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
      </FormField>

      <FormField orientation="vertical">
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
      </FormField>

      <FormField disabled>
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="Disabled入力" />
        </FormField.Control>
      </FormField>

      <FormField required requiredMark="badge">
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
      </FormField>

      <FormField required requiredMark="asterisk">
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
      </FormField>

      <FormField required requiredMark="both">
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
        <FormField.ErrorText>
          Error メッセージError メッセージ
          <br />
          Error メッセージ
        </FormField.ErrorText>
      </FormField>

      <FormField required requiredMark="both">
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
        <FormField.HelperText>
          Helper テキストHelper テキスト
          <br />
          Helper テキスト
        </FormField.HelperText>
      </FormField>

      <FormField required requiredMark="both">
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <Input placeholder="placeholder" />
        </FormField.Control>
        <FormField.HelperText>
          Helper テキストHelper テキスト
          <br />
          Helper テキスト
        </FormField.HelperText>
        <FormField.ErrorText>
          Error メッセージError メッセージ
          <br />
          Error メッセージ
        </FormField.ErrorText>
      </FormField>
    </div>
  ),
};
