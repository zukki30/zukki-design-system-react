import { createContext, use } from 'react';

/**
 * カードのサイズ（余白の大きさ）
 */
export type CardSize = 'md' | 'sm';

/**
 * Card がサブコンポーネントへ共有する値。
 *
 * 利用側が独自のパーツ（区切り線付きの領域など）を作るときは
 * `useCardContext()` からこの値を参照する
 */
export type CardContextValue = {
  state: {
    /**
     * カードのサイズ。パーツはこの値から余白を決める
     */
    size: CardSize;
  };
};

export const CardContext = createContext<CardContextValue | null>(null);

/**
 * Card の context を取得する。`<Card>` の外側で呼ぶと例外を投げる
 */
export const useCardContext = (): CardContextValue => {
  const context = use(CardContext);

  if (context === null) {
    throw new Error('Card のサブコンポーネントは <Card> の内側で使用してください');
  }

  return context;
};
