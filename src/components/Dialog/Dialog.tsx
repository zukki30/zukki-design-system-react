import { clsx } from 'clsx';
import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  type ReactNode,
  useEffect,
  useId,
  useRef,
} from 'react';

import { Icon } from '../Icon';
import { IconButton } from '../IconButton';

import {
  dialog,
  dialogBody,
  dialogClose,
  dialogFooter,
  dialogHeader,
  dialogTitle,
} from './Dialog.css';

const CLOSE_ICON_SIZE = 20;

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
} & Omit<ComponentPropsWithoutRef<'dialog'>, 'open' | 'title' | 'children'>;

export const Dialog = ({
  open,
  onClose,
  title,
  footer,
  showCloseButton = true,
  closeOnOverlayClick = true,
  children,
  className,
  ...props
}: Props) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
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
      ref={dialogRef}
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
              <Icon name="close" width={CLOSE_ICON_SIZE} height={CLOSE_ICON_SIZE} />
            </IconButton>
          )}
        </div>
      )}

      {children !== undefined && <div className={dialogBody}>{children}</div>}

      {footer !== undefined && <div className={dialogFooter}>{footer}</div>}
    </dialog>
  );
};
