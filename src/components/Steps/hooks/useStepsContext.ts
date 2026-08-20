import { createContext, use } from 'react';

/**
 * ステップの並び方向
 */
export type StepsOrientation = 'horizontal' | 'vertical';

/**
 * Steps が子孫のサブコンポーネントへ共有する値
 */
export type StepsContextValue = {
  /**
   * 現在のステップ番号（1 始まり）
   */
  current: number;
  /**
   * ステップの並び方向
   */
  orientation: StepsOrientation;
  /**
   * Steps 直下の Steps.Item の総数
   */
  total: number;
  /**
   * ステップをクリックしたときに呼ばれるハンドラ。未指定ならステップは非インタラクティブになる
   */
  onClick?: (stepNumber: number) => void;
};

export const StepsContext = createContext<StepsContextValue | null>(null);

/**
 * Steps が共有する値を読み取る。
 *
 * Steps.Item は自身の状態（現在／完了）を current との比較で決めるため、Steps の外では成立しない。
 * 静かに既定値へフォールバックせず、使い方の誤りとして例外を投げる
 *
 * @param componentName エラーメッセージに含めるサブコンポーネント名
 */
export const useStepsContext = (componentName: string): StepsContextValue => {
  const context = use(StepsContext);

  if (context === null) {
    throw new Error(`${componentName} は Steps の内側でのみ使用できます。`);
  }

  return context;
};
