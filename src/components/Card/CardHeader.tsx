import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { cardHeader } from './Card.css';
import { useCardContext } from './hooks';

export type CardHeaderProps = ComponentPropsWithRef<'div'>;

/**
 * カードのヘッダー。Card.Title / Card.Action を任意の組み合わせで配置できる
 */
export const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  const { size } = useCardContext('Card.Header');

  return <div className={clsx(cardHeader[size], className)} {...props} />;
};
