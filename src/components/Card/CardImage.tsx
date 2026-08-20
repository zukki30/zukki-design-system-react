import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { cardImage } from './Card.css';

export type CardImageProps = ComponentPropsWithRef<'div'>;

/**
 * カード上部の画像領域。img 要素などを children に渡す
 */
export const CardImage = ({ className, ...props }: CardImageProps) => {
  return <div className={clsx(cardImage, className)} {...props} />;
};
