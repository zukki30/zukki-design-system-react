import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { cardTitle } from './Card.css';

export type CardTitleProps = ComponentPropsWithRef<'div'>;

/**
 * ヘッダーのタイトル。
 *
 * Card.Action を押し出さないよう 1 行に固定され、あふれたぶんは省略記号で表示される。
 * `overflow: hidden` がかかるため、内部に配置した要素のフォーカスリングは切られうる。
 * 見出しとしての意味付けが必要な場合は `role="heading"` と `aria-level` を指定する
 */
export const CardTitle = ({ className, ...props }: CardTitleProps) => {
  return <div className={clsx(cardTitle, className)} {...props} />;
};
