import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { cardFooter } from './Card.css';
import { useCardContext } from './hooks';

export type CardFooterProps = ComponentPropsWithRef<'div'>;

/**
 * カードのフッター
 */
export const CardFooter = ({ className, ...props }: CardFooterProps) => {
  const { size } = useCardContext('Card.Footer');

  return <div className={clsx(cardFooter[size], className)} {...props} />;
};
