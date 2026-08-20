import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { cardBody } from './Card.css';
import { useCardContext } from './hooks';

export type CardBodyProps = ComponentPropsWithRef<'div'>;

/**
 * カード本文
 */
export const CardBody = ({ className, ...props }: CardBodyProps) => {
  const { size } = useCardContext('Card.Body');

  return <div className={clsx(cardBody[size], className)} {...props} />;
};
