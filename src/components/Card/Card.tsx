import { clsx } from 'clsx';
import { createElement, useMemo } from 'react';
import type { ComponentPropsWithRef, Ref } from 'react';

import type { HeadingLevel } from '@/types';
import { headingTag } from '@/utils/headingTag';

import {
  card,
  cardAction,
  cardBody,
  cardFooter,
  cardHeader,
  cardImage,
  cardTitle,
} from './Card.css';
import { CardContext, type CardContextValue, type CardSize, useCardContext } from './CardContext';

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
// サブコンポーネントをプロパティとしてぶら下げるため、ここだけ関数宣言で定義する
// （アロー関数だと後から Card.Header 等を生やせない）
export function Card({ size = 'md', className, children, ...props }: CardProps) {
  // context の value が毎レンダー新しい参照になると、children が変わっていなくても
  // サブコンポーネントの再レンダーが走るため、size が変わったときだけ更新する
  const contextValue = useMemo<CardContextValue>(() => ({ state: { size } }), [size]);

  return (
    // data-size は size と常に一致させたいので、利用側の props より後に指定する
    <div {...props} className={clsx(card, className)} data-size={size}>
      <CardContext value={contextValue}>{children}</CardContext>
    </div>
  );
}

export type CardImageProps = ComponentPropsWithRef<'div'>;

/**
 * カード上部の画像領域。img 要素などを children に渡す
 */
const CardImage = ({ className, ...props }: CardImageProps) => {
  return <div {...props} className={clsx(cardImage, className)} />;
};

export type CardHeaderProps = ComponentPropsWithRef<'div'>;

/**
 * カードのヘッダー。Card.Title / Card.Action を任意の組み合わせで配置できる
 */
const CardHeader = ({ className, ...props }: CardHeaderProps) => {
  const {
    state: { size },
  } = useCardContext();

  return <div {...props} className={clsx(cardHeader[size], className)} />;
};

export type CardTitleProps = {
  /**
   * 見出しレベル。指定すると `h2`〜`h6` として描画する。
   *
   * カードが文書構造のどの階層に置かれるかはライブラリ側からは分からないため、
   * 省略時は `div` で描画し、見出しとしての意味付けは行わない。
   * カードのタイトルを見出しとして扱いたい場合に、周囲の見出し階層に合わせて指定する。
   *
   * 変わるのは意味付けだけで、見た目（フォントサイズ・太さ）はレベルによらず同じ
   */
  level?: HeadingLevel;
  /**
   * タイトル要素への ref。
   *
   * 転送先は `level` 未指定なら `div`、指定時は `h2`〜`h6` と変わるため、
   * 共通の親である `HTMLElement` として受け取る
   */
  ref?: Ref<HTMLElement>;
} & Omit<ComponentPropsWithRef<'div'>, 'ref'>;

/**
 * ヘッダーのタイトル。
 *
 * Card.Action を押し出さないよう 1 行に固定され、あふれたぶんは省略記号で表示される。
 * `overflow: hidden` がかかるため、内部に配置した要素のフォーカスリングは切られうる。
 * 見出しとしての意味付けが必要な場合は `level` を指定する
 */
const CardTitle = ({ level, className, ref, ...props }: CardTitleProps) => {
  // level 未指定のときは見出しの意味付けをせず div で描画する。
  // 描画するタグが level で変わるため、JSX ではなく createElement で組み立てる
  // （JSX にすると大文字始まりの変数になり、レンダーごとにコンポーネントを
  // 作っていると誤検知される。実際に渡すのは 'h2' などのタグ名の文字列）
  return createElement(level === undefined ? 'div' : headingTag(level), {
    ...props,
    ref,
    className: clsx(cardTitle, className),
  });
};

export type CardActionProps = ComponentPropsWithRef<'div'>;

/**
 * ヘッダー右側に置く補足要素（リンクなど）。Card.Title の有無に依存しない
 */
const CardAction = ({ className, ...props }: CardActionProps) => {
  return <div {...props} className={clsx(cardAction, className)} />;
};

export type CardBodyProps = ComponentPropsWithRef<'div'>;

/**
 * カード本文
 */
const CardBody = ({ className, ...props }: CardBodyProps) => {
  const {
    state: { size },
  } = useCardContext();

  return <div {...props} className={clsx(cardBody[size], className)} />;
};

export type CardFooterProps = ComponentPropsWithRef<'div'>;

/**
 * カードのフッター
 */
const CardFooter = ({ className, ...props }: CardFooterProps) => {
  const {
    state: { size },
  } = useCardContext();

  return <div {...props} className={clsx(cardFooter[size], className)} />;
};

// compound components として合成できるようにルートへぶら下げる
Card.Image = CardImage;
Card.Header = CardHeader;
Card.Title = CardTitle;
Card.Action = CardAction;
Card.Body = CardBody;
Card.Footer = CardFooter;
