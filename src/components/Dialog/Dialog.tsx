import { clsx } from 'clsx';
import {
  type ComponentProps,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';

import { useIdRegistry } from '@/hooks/useIdRegistry';
import { useMergedRef } from '@/hooks/useMergedRef';

import { Icon } from '../Icon/Icon';
import { IconButton } from '../IconButton/IconButton';

import {
  dialog,
  dialogBody,
  dialogClose,
  dialogFooter,
  dialogHeader,
  dialogTitle,
} from './Dialog.css';
import { DialogContext, type DialogContextValue, useDialogContext } from './DialogContext';

const CLOSE_ICON_SIZE = 20;

// 静的な要素は巻き上げる
const CLOSE_ICON = <Icon name="close" width={CLOSE_ICON_SIZE} height={CLOSE_ICON_SIZE} />;

export type DialogProps = {
  /**
   * ダイアログの開閉状態
   */
  open: boolean;
  /**
   * ダイアログを閉じるときに呼ばれる（Escape キー・`Dialog.Close`・オーバーレイクリック）
   */
  onClose?: () => void;
  /**
   * オーバーレイ（背景）クリックで閉じるか。
   *
   * 描画を伴わない挙動の切り替えのため、合成ではなく prop で受け取る
   * @default true
   */
  closeOnOverlayClick?: boolean;
  /**
   * `Dialog.Header` / `Dialog.Body` / `Dialog.Footer` などを組み合わせて構成する
   */
  children?: ReactNode;
  // title はネイティブの属性（ツールチップ）だが、旧 API の見出し用 prop と紛らわしく、
  // 移行時に型エラーにならず素通りしてしまうため引き続き受け付けない
} & Omit<ComponentPropsWithRef<'dialog'>, 'open' | 'title' | 'children'>;

/**
 * モーダルダイアログ。
 *
 * 中身は `Dialog.Header` / `Dialog.Title` / `Dialog.Body` / `Dialog.Footer` / `Dialog.Close` を
 * 合成して組み立てる。閉じるボタンやフッターの有無は、描画するかどうかで表現する
 *
 * **開閉は必ず `open` prop で制御すること。**
 * 転送された `ref` から `showModal()` / `close()` を直接呼ぶと、`open` prop と実際の
 * 表示状態が食い違い、以降の `open` の変化が同期されなくなる。
 * `ref` はフォーカス制御など、開閉以外の用途に使う
 *
 * @example
 * <Dialog open={open} onClose={close}>
 *   <Dialog.Header>
 *     <Dialog.Title>タイトル</Dialog.Title>
 *     <Dialog.Close />
 *   </Dialog.Header>
 *   <Dialog.Body>本文</Dialog.Body>
 *   <Dialog.Footer>
 *     <Button onClick={close}>閉じる</Button>
 *   </Dialog.Footer>
 * </Dialog>
 */
// サブコンポーネントをプロパティとしてぶら下げるため、ここだけ関数宣言で定義する
// （アロー関数だと後から Dialog.Header 等を生やせない）
export function Dialog({
  open,
  onClose,
  closeOnOverlayClick = true,
  children,
  className,
  ref,
  ...props
}: DialogProps) {
  // showModal / close の呼び出しに DOM 要素が必要なため、内部で保持しつつ利用側の ref にも転送する
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mergedRef = useMergedRef(ref, dialogRef);
  // Dialog.Title は Dialog.Header の内側にネストされ、ルートからは children を検査できない。
  // そのためタイトル側から id を登録してもらい、aria-labelledby に反映する
  const [titleIds, registerTitle] = useIdRegistry();

  // onClose はインライン関数で渡されるのが一般的で、そのまま依存にすると context が毎レンダー
  // 作り直されて memo 化が効かない。最新の onClose を ref 経由で読み、close の参照を固定する
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  // open の変化をネイティブ dialog の showModal/close に同期する
  useEffect(() => {
    const dialogElement = dialogRef.current;
    if (dialogElement === null) {
      return;
    }

    if (open && !dialogElement.open) {
      dialogElement.showModal();
    } else if (!open && dialogElement.open) {
      dialogElement.close();
    }
  }, [open]);

  const handleOverlayClick = (event: MouseEvent<HTMLDialogElement>) => {
    // ダイアログ要素自身（＝オーバーレイ領域）がクリックされたときのみ閉じる
    if (closeOnOverlayClick && event.target === dialogRef.current) {
      onClose?.();
    }
  };

  // context の値は全サブコンポーネントの再レンダー要因になるため memo 化する。
  // registerTitle / close はどちらも参照が安定しているので、実質 open の変化でのみ作り直される
  const contextValue = useMemo<DialogContextValue>(
    () => ({
      state: { open },
      actions: { close: () => onCloseRef.current?.() },
      meta: { registerTitle },
    }),
    [open, registerTitle]
  );

  return (
    <DialogContext value={contextValue}>
      <dialog
        ref={mergedRef}
        className={clsx(dialog, className)}
        // 登録されたタイトルがあるときだけ紐付ける（未描画なら参照先が存在しないため）
        aria-labelledby={titleIds.length > 0 ? titleIds.join(' ') : undefined}
        onClose={onClose}
        onCancel={onClose}
        onClick={handleOverlayClick}
        {...props}
      >
        {children}
      </dialog>
    </DialogContext>
  );
}

export type DialogHeaderProps = ComponentPropsWithRef<'div'>;

/**
 * ダイアログのヘッダー。`Dialog.Title` と `Dialog.Close` を並べる
 */
const DialogHeader = ({ className, ...props }: DialogHeaderProps) => {
  return <div className={clsx(dialogHeader, className)} {...props} />;
};

export type DialogTitleProps = Omit<ComponentPropsWithRef<'h2'>, 'id'>;

/**
 * ダイアログのタイトル。
 * 描画するとルートの `aria-labelledby` が自動で紐付く。
 *
 * 1 つの Dialog につき 1 つだけ描画することを想定している
 * （複数描画した場合、`aria-labelledby` にはすべての id が並ぶ）
 */
const DialogTitle = ({ className, ...props }: DialogTitleProps) => {
  const {
    meta: { registerTitle },
  } = useDialogContext();
  // id はインスタンスごとに採番する。context で共有すると複数描画時に DOM で id が重複する
  const titleId = useId();

  // マウントされている間だけ id を登録する（registerTitle は登録解除用の関数を返す）
  useEffect(() => registerTitle(titleId), [registerTitle, titleId]);

  return <h2 id={titleId} className={clsx(dialogTitle, className)} {...props} />;
};

export type DialogBodyProps = ComponentPropsWithRef<'div'>;

/**
 * ダイアログの本文
 */
const DialogBody = ({ className, ...props }: DialogBodyProps) => {
  return <div className={clsx(dialogBody, className)} {...props} />;
};

export type DialogFooterProps = ComponentPropsWithRef<'div'>;

/**
 * ダイアログのフッター。ボタンなどを右寄せで並べる
 */
const DialogFooter = ({ className, ...props }: DialogFooterProps) => {
  return <div className={clsx(dialogFooter, className)} {...props} />;
};

export type DialogCloseProps = Omit<
  ComponentProps<typeof IconButton>,
  'aria-label' | 'children'
> & {
  /**
   * 閉じるボタンのアクセシブルネーム
   * @default '閉じる'
   */
  'aria-label'?: string;
  /**
   * ボタンの内容。未指定のときは閉じるアイコンを描画する
   */
  children?: ReactNode;
};

/**
 * ダイアログを閉じるボタン。描画するかどうかで閉じるボタンの有無を表現する。
 *
 * 閉じるのを取りやめたい場合は、`onClick` で `event.preventDefault()` を呼ぶ
 */
const DialogClose = ({
  children,
  className,
  onClick,
  'aria-label': ariaLabel = '閉じる',
  ...props
}: DialogCloseProps) => {
  const {
    actions: { close },
  } = useDialogContext();

  // 利用側の onClick を潰さずに、実行後へ閉じる処理を足す
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    onClick?.(event);

    // 利用側が preventDefault したときは閉じない（入力途中の確認などに使える逃げ道）
    if (event.defaultPrevented) {
      return;
    }

    close();
  };

  return (
    <IconButton
      className={clsx(dialogClose, className)}
      variant="secondary-exposed"
      size="sm"
      aria-label={ariaLabel}
      onClick={handleClick}
      {...props}
    >
      {children ?? CLOSE_ICON}
    </IconButton>
  );
};

// compound components として合成できるようにルートへぶら下げる
Dialog.Header = DialogHeader;
Dialog.Title = DialogTitle;
Dialog.Body = DialogBody;
Dialog.Footer = DialogFooter;
Dialog.Close = DialogClose;
