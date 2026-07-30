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

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  tags: ['autodocs'],
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
