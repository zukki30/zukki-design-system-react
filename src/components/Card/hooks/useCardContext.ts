import { createContext, use } from 'react';

/**
 * カードのサイズ（余白の大きさ）
 */
export type CardSize = 'md' | 'sm';

/**
 * Card が子孫のサブコンポーネントへ共有する値
 */
export type CardContextValue = {
  size: CardSize;
};

export const CardContext = createContext<CardContextValue | null>(null);

/**
 * Card が共有する値を読み取る。
 *
 * サブコンポーネントは余白を size から決めるため、Card の外では成立しない。
 * 静かに既定値へフォールバックせず、使い方の誤りとして例外を投げる
 *
 * @param componentName エラーメッセージに含めるサブコンポーネント名
 */
export const useCardContext = (componentName: string): CardContextValue => {
  const context = use(CardContext);

  if (context === null) {
    throw new Error(`${componentName} は Card の内側でのみ使用できます。`);
  }

  return context;
};
