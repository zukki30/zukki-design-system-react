import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { cardAction } from './Card.css';
import { useCardContext } from './hooks';

export type CardActionProps = ComponentPropsWithRef<'div'>;

/**
 * ヘッダー右側に置く補足要素（リンクなど）。Card.Title の有無に依存しない
 */
export const CardAction = ({ className, ...props }: CardActionProps) => {
  // size は参照しないが、Card の外での誤用を他のサブコンポーネントと同じ形で検知する
  useCardContext('Card.Action');

  return <div className={clsx(cardAction, className)} {...props} />;
};
