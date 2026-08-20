import { createContext, use } from 'react';

/**
 * Steps が Steps.Item ごとに割り当てるステップ番号（1 始まり）
 *
 * 番号は子の並び順そのものなので、利用側に書かせず Steps が採番して個別に共有する。
 * 値が 1 件ごとに変わるため StepsContext とは別の context に分けている
 */
export const StepsItemNumberContext = createContext<number | null>(null);

/**
 * Steps が割り当てたステップ番号を読み取る。
 *
 * @param componentName エラーメッセージに含めるサブコンポーネント名
 */
export const useStepsItemNumber = (componentName: string): number => {
  const stepNumber = use(StepsItemNumberContext);

  if (stepNumber === null) {
    throw new Error(`${componentName} は Steps の内側でのみ使用できます。`);
  }

  return stepNumber;
};
