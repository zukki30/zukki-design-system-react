import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import {
  card,
  cardBody,
  cardFooter,
  cardHeader,
  cardHeaderMeta,
  cardImage,
  cardTitle,
} from './Card.css';

/**
 * カードのサイズ（余白の大きさ）
 */
export type CardSize = 'md' | 'sm';

type Props = {
  /**
   * カードのサイズ
   * @default 'md'
   */
  size?: CardSize;
  /**
   * カード上部に表示する画像領域（img 要素など）
   */
  image?: ReactNode;
  /**
   * ヘッダーのタイトル
   */
  title?: ReactNode;
  /**
   * ヘッダー右側に表示する補足要素（リンクなど）。title 指定時のみ表示される
   */
  action?: ReactNode;
  /**
   * フッターに表示する要素
   */
  footer?: ReactNode;
  /**
   * カード本文
   */
  children?: ReactNode;
} & ComponentPropsWithoutRef<'div'>;

export const Card = ({
  size = 'md',
  image,
  title,
  action,
  footer,
  children,
  className,
  ...props
}: Props) => {
  return (
    <div className={clsx(card, className)} data-size={size} {...props}>
      {image !== undefined && <div className={cardImage}>{image}</div>}

      {title !== undefined && (
        <div className={cardHeader}>
          <div className={cardTitle}>{title}</div>
          {action !== undefined && <div className={cardHeaderMeta}>{action}</div>}
        </div>
      )}

      {children !== undefined && <div className={cardBody}>{children}</div>}

      {footer !== undefined && <div className={cardFooter}>{footer}</div>}
    </div>
  );
};
