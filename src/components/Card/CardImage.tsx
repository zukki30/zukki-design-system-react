import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { cardImage } from './Card.css';
import { useCardContext } from './hooks';

export type CardImageProps = ComponentPropsWithRef<'div'>;

/**
 * カード上部の画像領域。img 要素などを children に渡す
 */
export const CardImage = ({ className, ...props }: CardImageProps) => {
  // size は参照しないが、Card の外での誤用を他のサブコンポーネントと同じ形で検知する
  useCardContext('Card.Image');

  return <div className={clsx(cardImage, className)} {...props} />;
};
