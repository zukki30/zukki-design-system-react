import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';

import { Button } from '../Button';

import { Dialog } from './Dialog';

const bodyText = (
  <>
    <p style={{ margin: 0, lineHeight: 1.5 }}>sample text sample text sample text</p>
    <p style={{ margin: 0, lineHeight: 1.5 }}>
      サンプルテキストサンプルテキストサンプルテキストサンプルテキスト
    </p>
    <p style={{ margin: 0, lineHeight: 1.5 }}>サンプルテキストサンプルテキスト</p>
  </>
);

const docsDescription = [
  'ネイティブの `<dialog>` を `showModal()` で開くモーダルダイアログです。',
  '',
  '### 背景スクロールについて',
  '',
  'モーダル表示中の `<dialog>` はブラウザ既定のスタイルで `overflow: auto` と `max-height` を持つため、',
  '本文が長いとダイアログ自体がスクロールします。このスクロールが背景ドキュメントへ連鎖しないよう、',
  'Dialog では `overscroll-behavior: contain` を指定しています。',
  '',
  '一方で **背景ドキュメント自体のスクロールは Dialog では止めません**。',
  '`body` のスタイルを書き換える実装はアプリ側のレイアウト（スクロールバー幅の補正や独自のスクロール制御）と',
  '競合しやすいため、ロックするかどうかの判断は利用側に委ねています。',
  '',
  '背景を固定したい場合は、開閉に合わせて利用側で制御してください。',
  '',
  '```tsx',
  'useEffect(() => {',
  '  if (!open) {',
  '    return;',
  '  }',
  '',
  '  const previousOverflow = document.body.style.overflow;',
  "  document.body.style.overflow = 'hidden';",
  '',
  '  return () => {',
  '    document.body.style.overflow = previousOverflow;',
  '  };',
  '}, [open]);',
  '```',
].join('\n');

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: docsDescription,
      },
    },
  },
  args: {
    open: false,
    title: 'Dialog Title',
    children: bodyText,
  },
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          ダイアログを開く
        </Button>
        <Dialog
          {...args}
          open={open}
          onClose={() => setOpen(false)}
          footer={
            args.footer ?? (
              <>
                <Button size="sm" variant="default" onClick={() => setOpen(false)}>
                  ボタン
                </Button>
                <Button size="sm" variant="primary" onClick={() => setOpen(false)}>
                  ボタン
                </Button>
              </>
            )
          }
        />
      </>
    );
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Full: Story = {};

export const NotHeader: Story = {
  args: {
    title: undefined,
  },
};

export const NotFooter: Story = {
  args: {
    footer: undefined,
  },
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          ダイアログを開く
        </Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)} footer={undefined} />
      </>
    );
  },
};

export const Simple: Story = {
  args: {
    title: undefined,
    footer: undefined,
  },
  render: function Render(args) {
    const [open, setOpen] = useState(false);

    return (
      <>
        <Button variant="primary" onClick={() => setOpen(true)}>
          ダイアログを開く
        </Button>
        <Dialog {...args} open={open} onClose={() => setOpen(false)} footer={undefined} />
      </>
    );
  },
};
