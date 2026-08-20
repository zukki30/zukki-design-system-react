import { clsx } from 'clsx';
import type { ComponentPropsWithRef } from 'react';

import { card } from './Card.css';
import { CardAction } from './CardAction';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';
import { CardHeader } from './CardHeader';
import { CardImage } from './CardImage';
import { CardTitle } from './CardTitle';
import { CardContext } from './hooks';
import type { CardSize } from './hooks';

export type CardProps = {
  /**
   * カードのサイズ
   * @default 'md'
   */
  size?: CardSize;
} & ComponentPropsWithRef<'div'>;

/**
 * カード。表示する領域は Card.Image / Card.Header / Card.Body / Card.Footer を
 * 組み合わせて構成する。余白の大きさ（size）は context 経由で共有される
 *
 * @example
 * ```tsx
 * <Card size="sm">
 *   <Card.Image>
 *     <img src="thumbnail.png" alt="" />
 *   </Card.Image>
 *   <Card.Header>
 *     <Card.Title>タイトル</Card.Title>
 *     <Card.Action>
 *       <a href="#">more</a>
 *     </Card.Action>
 *   </Card.Header>
 *   <Card.Body>本文</Card.Body>
 *   <Card.Footer>フッター</Card.Footer>
 * </Card>
 * ```
 */
export const Card = ({ size = 'md', className, children, ...props }: CardProps) => {
  return (
    <div className={clsx(card, className)} data-size={size} {...props}>
      <CardContext value={{ size }}>{children}</CardContext>
    </div>
  );
};

Card.Image = CardImage;
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Action = CardAction;
Card.Body = CardBody;
Card.Footer = CardFooter;
