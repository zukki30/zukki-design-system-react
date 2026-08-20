import { clsx } from 'clsx';
import { useMemo } from 'react';
import type { ComponentPropsWithRef } from 'react';

import { card } from './Card.css';
import { CardAction } from './CardAction';
import { CardBody } from './CardBody';
import { CardFooter } from './CardFooter';
import { CardHeader } from './CardHeader';
import { CardImage } from './CardImage';
import { CardTitle } from './CardTitle';
import { CardContext } from './hooks';
import type { CardContextValue, CardSize } from './hooks';

export type CardProps = {
  /**
   * カードのサイズ。サブコンポーネントの余白は context 経由でこの値から決まる。
   *
   * ルート要素には `data-size` 属性としても出力される。スタイルはすべて
   * `styleVariants()` 側で解決しているため CSS からは参照していないが、
   * 利用側がカード全体を size 別にスタイリングするためのフックとして残している
   *
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
  // context の value が毎レンダー新しい参照になると、children が変わっていなくても
  // サブコンポーネントの再レンダーが走るため、size が変わったときだけ更新する
  const contextValue = useMemo<CardContextValue>(() => ({ size }), [size]);

  return (
    // data-size は size と常に一致させたいので、利用側の props より後に指定する
    <div {...props} className={clsx(card, className)} data-size={size}>
      <CardContext value={contextValue}>{children}</CardContext>
    </div>
  );
};

Card.Image = CardImage;
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Action = CardAction;
Card.Body = CardBody;
Card.Footer = CardFooter;
