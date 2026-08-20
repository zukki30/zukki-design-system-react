import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { cardAction } from './Card.css';

export type CardActionProps = ComponentPropsWithRef<'div'>;

/**
 * ヘッダー右側に置く補足要素（リンクなど）。Card.Title の有無に依存しない
 */
export const CardAction = ({ className, ...props }: CardActionProps) => {
  return <div className={clsx(cardAction, className)} {...props} />;
};
