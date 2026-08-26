import type { Meta, StoryObj } from '@storybook/react-vite';
import { type ComponentProps, type ReactNode, useState } from 'react';

import { Button } from '../Button';

import { Dialog, useDialogContext } from './index';

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
  '### 構成',
  '',
  '中身は compound components を合成して組み立てます。',
  'ヘッダーやフッター、閉じるボタンの有無は boolean prop ではなく、',
  '**そのパーツを描画するかどうか**で表現します。',
  '',
  '```tsx',
  '<Dialog open={open} onClose={close}>',
  '  <Dialog.Header>',
  '    <Dialog.Title>タイトル</Dialog.Title>',
  '    <Dialog.Close />',
  '  </Dialog.Header>',
  '  <Dialog.Body>本文</Dialog.Body>',
  '  <Dialog.Footer>',
  '    <Button onClick={close}>閉じる</Button>',
  '  </Dialog.Footer>',
  '</Dialog>',
  '```',
  '',
  '`Dialog.Title` を描画すると、ルートの `aria-labelledby` が自動で紐付きます。',
  'タイトルを置かない場合は、代わりに `aria-label` を指定してください。',
  '',
  '### タイトルの見出しレベル',
  '',
  'ダイアログの中は背景が inert になる独立したコンテキストで、`Dialog.Title` は常にその最上位の',
  '見出しにあたるため、既定で `h2` として描画します（`div` が既定の `Card.Title` とはここが違います）。',
  '',
  '本文に見出しを含むなど階層を合わせたい場合は `level` を指定してください。',
  '変わるのは意味付けだけで、見た目はレベルによらず同じです。',
  '',
  '```tsx',
  '<Dialog.Title level={3}>タイトル</Dialog.Title>',
  '```',
  '',
  '### 独自パーツの作成',
  '',
  '`useDialogContext()` で開閉状態と閉じる操作を参照できるため、',
  'フッターのキャンセルボタンなどを利用側で自由に組み立てられます。',
  '',
  '```tsx',
  'const CancelButton = () => {',
  '  const { actions } = useDialogContext();',
  '',
  '  return <Button onClick={actions.close}>キャンセル</Button>;',
  '};',
  '```',
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

/**
 * context から閉じる操作を受け取る、利用側で組み立てたフッターボタン
 */
const FooterButton = ({
  children,
  variant,
}: {
  children: ReactNode;
  variant: ComponentProps<typeof Button>['variant'];
}) => {
  const {
    actions: { close },
  } = useDialogContext();

  return (
    <Button size="sm" variant={variant} onClick={close}>
      {children}
    </Button>
  );
};

/**
 * 開閉状態は利用側が持つため、ストーリーでは開くボタンと合わせて描画する
 */
const DialogDemo = ({
  children,
  defaultOpen = false,
  ...props
}: Omit<ComponentProps<typeof Dialog>, 'open' | 'onClose'> & { defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        ダイアログを開く
      </Button>

      <Dialog {...props} open={open} onClose={() => setOpen(false)}>
        {children}
      </Dialog>
    </>
  );
};

const meta = {
  title: 'Components/Dialog',
  component: Dialog,
  subcomponents: {
    'Dialog.Header': Dialog.Header,
    'Dialog.Title': Dialog.Title,
    'Dialog.Body': Dialog.Body,
    'Dialog.Footer': Dialog.Footer,
    'Dialog.Close': Dialog.Close,
  },
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
    open: false,
  },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ヘッダー・本文・フッターをすべて合成した構成
 */
export const Full: Story = {
  render: () => (
    <DialogDemo>
      <Dialog.Header>
        <Dialog.Title>Dialog Title</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>{bodyText}</Dialog.Body>
      <Dialog.Footer>
        <FooterButton variant="default">ボタン</FooterButton>
        <FooterButton variant="primary">ボタン</FooterButton>
      </Dialog.Footer>
    </DialogDemo>
  ),
};

/**
 * ヘッダーを描画しない構成。
 * タイトルが無いぶん、`aria-label` でアクセシブルネームを与える
 */
export const NoHeader: Story = {
  render: () => (
    <DialogDemo aria-label="お知らせ">
      <Dialog.Body>{bodyText}</Dialog.Body>
      <Dialog.Footer>
        <FooterButton variant="primary">ボタン</FooterButton>
      </Dialog.Footer>
    </DialogDemo>
  ),
};

/**
 * フッターを描画しない構成
 */
export const NoFooter: Story = {
  render: () => (
    <DialogDemo>
      <Dialog.Header>
        <Dialog.Title>Dialog Title</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>{bodyText}</Dialog.Body>
    </DialogDemo>
  ),
};

/**
 * 閉じるボタンを描画しない構成。
 * `Dialog.Close` を置かないことで表現する（boolean prop は不要）
 */
export const NoCloseButton: Story = {
  render: () => (
    <DialogDemo>
      <Dialog.Header>
        <Dialog.Title>Dialog Title</Dialog.Title>
      </Dialog.Header>
      <Dialog.Body>{bodyText}</Dialog.Body>
      <Dialog.Footer>
        <FooterButton variant="primary">閉じる</FooterButton>
      </Dialog.Footer>
    </DialogDemo>
  ),
};

/**
 * 本文だけの最小構成
 */
export const Simple: Story = {
  render: () => (
    <DialogDemo aria-label="お知らせ">
      <Dialog.Body>{bodyText}</Dialog.Body>
    </DialogDemo>
  ),
};

/**
 * オーバーレイクリックで閉じない構成。
 * 描画を伴わない挙動の切り替えのため、こちらは prop で指定する
 */
/**
 * 最初から開いた状態で描画する構成。
 *
 * 閉じている間はダイアログの中身が DOM に存在せず a11y 検査の対象にならないため、
 * 開いた状態のストーリーを必ず 1 つ残しておく
 */
export const Opened: Story = {
  render: () => (
    <DialogDemo defaultOpen>
      <Dialog.Header>
        <Dialog.Title>Dialog Title</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>{bodyText}</Dialog.Body>
      <Dialog.Footer>
        <FooterButton variant="default">ボタン</FooterButton>
        <FooterButton variant="primary">ボタン</FooterButton>
      </Dialog.Footer>
    </DialogDemo>
  ),
};

export const KeepOpenOnOverlayClick: Story = {
  render: () => (
    <DialogDemo closeOnOverlayClick={false}>
      <Dialog.Header>
        <Dialog.Title>Dialog Title</Dialog.Title>
        <Dialog.Close />
      </Dialog.Header>
      <Dialog.Body>{bodyText}</Dialog.Body>
    </DialogDemo>
  ),
};
