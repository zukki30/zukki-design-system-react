import { clsx } from 'clsx';
import {
  type ComponentPropsWithRef,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react';

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

const CLOSE_ICON_SIZE = 20;

// 静的な要素は巻き上げる
const CLOSE_ICON = <Icon name="close" width={CLOSE_ICON_SIZE} height={CLOSE_ICON_SIZE} />;

type Props = {
  /**
   * ダイアログの開閉状態
   */
  open: boolean;
  /**
   * ダイアログを閉じるときに呼ばれる（Escape キー・閉じるボタン・オーバーレイクリック）
   */
  onClose?: () => void;
  /**
   * ヘッダーのタイトル
   */
  title?: ReactNode;
  /**
   * フッターに表示する要素（ボタンなど）
   */
  footer?: ReactNode;
  /**
   * 閉じるボタンを表示するか
   * @default true
   */
  showCloseButton?: boolean;
  /**
   * オーバーレイ（背景）クリックで閉じるか
   * @default true
   */
  closeOnOverlayClick?: boolean;
  /**
   * ダイアログの本文
   */
  children?: ReactNode;
} & Omit<ComponentPropsWithRef<'dialog'>, 'open' | 'title' | 'children'>;

/**
 * モーダルダイアログ。
 *
 * **開閉は必ず `open` prop で制御すること。**
 * 転送された `ref` から `showModal()` / `close()` を直接呼ぶと、`open` prop と実際の
 * 表示状態が食い違い、以降の `open` の変化が同期されなくなる。
 * `ref` はフォーカス制御など、開閉以外の用途に使う
 */
export const Dialog = ({
  open,
  onClose,
  title,
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  children,
  className,
  ref,
  ...props
}: Props) => {
  // showModal / close の呼び出しに DOM 要素が必要なため、内部で保持しつつ利用側の ref にも転送する
  const dialogRef = useRef<HTMLDialogElement>(null);
  const mergedRef = useMergedRef(ref, dialogRef);
  const titleId = useId();

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

  return (
    <dialog
      ref={mergedRef}
      className={clsx(dialog, className)}
      aria-labelledby={title !== undefined ? titleId : undefined}
      onClose={onClose}
      onCancel={onClose}
      onClick={handleOverlayClick}
      {...props}
    >
      {(title !== undefined || showCloseButton) && (
        <div className={dialogHeader}>
          {title !== undefined && (
            <h2 className={dialogTitle} id={titleId}>
              {title}
            </h2>
          )}
          {showCloseButton && (
            <IconButton
              className={dialogClose}
              variant="secondary-exposed"
              size="sm"
              aria-label="閉じる"
              onClick={() => onClose?.()}
            >
              {CLOSE_ICON}
            </IconButton>
          )}
        </div>
      )}

      {children !== undefined && <div className={dialogBody}>{children}</div>}

      {footer !== undefined && <div className={dialogFooter}>{footer}</div>}
    </dialog>
  );
};
