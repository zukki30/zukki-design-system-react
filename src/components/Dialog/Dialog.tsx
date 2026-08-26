import { clsx } from 'clsx';
import {
  type ComponentProps,
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
  type SyntheticEvent,
  createElement,
  useEffect,
  useId,
  useMemo,
  useRef,
} from 'react';

import { useIdRegistry } from '@/hooks/useIdRegistry';
import { useMergedRef } from '@/hooks/useMergedRef';
import type { HeadingLevel } from '@/types';
import { headingTag } from '@/utils/headingTag';

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
   * ダイアログを閉じてほしいときに呼ばれる
   * （Escape キー・`Dialog.Close`・オーバーレイクリック・`<form method="dialog">`）。
   *
   * 1 回の操作につき 1 回だけ呼ばれる。
   * 利用側が `open` を `false` にしたことで閉じた場合は、既に閉じると決めた後なので呼ばれない。
   *
   * **これは「閉じる要求」であり、閉じるかどうかは `open` で決まる。**
   * Escape も含めてすべての経路で既定動作を止めているため、
   * 呼ばれても `open` を `true` のままにすれば閉じない（入力途中の確認などに使える）
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
  // 移行時に型エラーにならず素通りしてしまうため引き続き受け付けない。
  // ネイティブの onClose / onCancel は「閉じる要求」を表す上記の onClose と紛らわしく、
  // 内部で閉じる通知の起点として使っているため受け付けない
} & Omit<ComponentPropsWithRef<'dialog'>, 'open' | 'title' | 'children' | 'onClose' | 'onCancel'>;

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
  // 内部でオーバーレイクリックの判定に使うため、利用側の指定を潰さないよう合成する
  onClick,
  // ラベル付けは外部の見出しを指したい場合があるため、利用側から上書きできるようにする
  'aria-labelledby': ariaLabelledBy,
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

  // 利用側の onClick を潰さずに、実行後へオーバーレイクリックの処理を足す
  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    onClick?.(event);

    // 利用側が preventDefault したときは閉じない
    if (event.defaultPrevented) {
      return;
    }

    // ダイアログ要素自身（＝オーバーレイ領域）がクリックされたときのみ閉じる
    if (closeOnOverlayClick && event.target === dialogRef.current) {
      onClose?.();
    }
  };

  // Escape の既定動作（DOM を直接閉じる）は止め、他の経路と同じ「閉じる要求」に揃える。
  // 止めないと、利用側が onClose を受けて「まだ閉じない」と判断し open を true のままにしたとき、
  // DOM だけ閉じているのに open が変化せず、同期 effect も再実行されないため開き直せなくなる
  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();

    onClose?.();
  };

  // 実際に閉じたことの通知はネイティブの close イベントで拾う。
  // Escape は上の handleCancel で open 経由に寄せてあるため、ここに来るのは
  // <form method="dialog"> の送信と、ref から直接 close() を呼ばれた場合
  const handleNativeClose = () => {
    // open が false のまま閉じたときは、利用側の指示に従って閉じただけなので通知しない。
    // すべての閉じる経路は onClose → open=false → close() と流れるため、
    // ここで弾かないと 1 回の操作で onClose が 2 回呼ばれる
    if (!open) {
      return;
    }

    onClose?.();
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
      {/* パーツ間の配線を利用側の props に潰されないよう、{...props} は先に展開する */}
      {/* onClick はオーバーレイクリックで閉じるためのもの。キーボードでの閉じる操作は
          ネイティブ <dialog> の ESC（onCancel）が担っており、別途キーハンドラは要らない。
          jsx-a11y はそこまで追えないため、この 2 ルールに限って抑制する */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        {...props}
        ref={mergedRef}
        className={clsx(dialog, className)}
        // 登録されたタイトルがあるときだけ紐付ける（未描画なら参照先が存在しないため）
        aria-labelledby={ariaLabelledBy ?? (titleIds.length > 0 ? titleIds.join(' ') : undefined)}
        onClose={handleNativeClose}
        onCancel={handleCancel}
        onClick={handleClick}
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
  return <div {...props} className={clsx(dialogHeader, className)} />;
};

export type DialogTitleProps = {
  /**
   * 見出しレベル。
   *
   * ダイアログの中は背景が inert になる独立したコンテキストで、タイトルは常にその最上位の
   * 見出しにあたるため、`Card.Title` と違って省略時も見出しとして描画する。
   * 本文に見出しを含む場合など、階層を合わせたいときに指定する。
   *
   * 変わるのは意味付けだけで、見た目（フォントサイズ・太さ）はレベルによらず同じ
   *
   * @default 2
   */
  level?: HeadingLevel;
  // h2〜h6 はいずれも HTMLHeadingElement なので、ref の型は h2 のまま変わらない
} & Omit<ComponentPropsWithRef<'h2'>, 'id'>;

/**
 * ダイアログのタイトル。
 * 描画するとルートの `aria-labelledby` が自動で紐付く。
 *
 * 1 つの Dialog につき 1 つだけ描画することを想定している
 * （複数描画した場合、`aria-labelledby` にはすべての id が並ぶ）
 */
const DialogTitle = ({ level = 2, className, ...props }: DialogTitleProps) => {
  const {
    meta: { registerTitle },
  } = useDialogContext();
  // id はインスタンスごとに採番する。context で共有すると複数描画時に DOM で id が重複する
  const titleId = useId();

  // マウントされている間だけ id を登録する（registerTitle は登録解除用の関数を返す）
  useEffect(() => registerTitle(titleId), [registerTitle, titleId]);

  // 描画するタグが level で変わる。JSX で書くと大文字始まりの変数になり、
  // レンダーごとにコンポーネントを作っていると誤検知されるため createElement を使う
  // （実際に渡しているのは 'h2' などのタグ名の文字列で、識別子は毎回同じ）
  return createElement(headingTag(level), {
    ...props,
    // ルートの aria-labelledby から参照される id。型でも Omit していて利用側からは変えられない
    id: titleId,
    className: clsx(dialogTitle, className),
  });
};

export type DialogBodyProps = ComponentPropsWithRef<'div'>;

/**
 * ダイアログの本文
 */
const DialogBody = ({ className, ...props }: DialogBodyProps) => {
  return <div {...props} className={clsx(dialogBody, className)} />;
};

export type DialogFooterProps = ComponentPropsWithRef<'div'>;

/**
 * ダイアログのフッター。ボタンなどを右寄せで並べる
 */
const DialogFooter = ({ className, ...props }: DialogFooterProps) => {
  return <div {...props} className={clsx(dialogFooter, className)} />;
};

// type は受け付けない。`type="submit"` を <form method="dialog"> 内で指定すると、
// このボタンの onClose とフォーム送信による close の 2 経路から閉じることになり、
// どちらが閉じたのかが曖昧になる。送信を伴う閉じ方は Button と useDialogContext で組む
export type DialogCloseProps = Omit<
  ComponentProps<typeof IconButton>,
  'aria-label' | 'children' | 'type'
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
  // 見た目は既定を持ちつつ利用側から差し替えられるよう、明示的に受け取って合成する
  variant = 'secondary-exposed',
  size = 'sm',
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
      {...props}
      className={clsx(dialogClose, className)}
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      onClick={handleClick}
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
