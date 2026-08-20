import { createContext, use } from 'react';

/**
 * Steps が直下の子ごとに割り当てるステップ番号（1 始まり）。
 *
 * 番号は子の並び順そのものなので、利用側に書かせず Steps が採番して個別に共有する。
 * 値が 1 件ごとに変わるため、全パーツで共有する StepsContext とは別の context に分けている
 */
export const StepsItemNumberContext = createContext<number | null>(null);

/**
 * Steps が割り当てたステップ番号を取得する。`<Steps>` の外側で呼ぶと例外を投げる
 */
export const useStepsItemNumber = (): number => {
  const stepNumber = use(StepsItemNumberContext);

  if (stepNumber === null) {
    throw new Error('Steps のサブコンポーネントは <Steps> の内側で使用してください');
  }

  return stepNumber;
};
