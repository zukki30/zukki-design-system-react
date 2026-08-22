import { createContext, use } from 'react';

/**
 * ステップの並び方向
 */
export type StepsOrientation = 'horizontal' | 'vertical';

/**
 * Steps がサブコンポーネントへ共有する値。
 *
 * 利用側が独自のパーツ（アイコンだけのステップなど）を作るときは、
 * `useStepsContext()` と `useStepsItemNumber()` からこの値を参照する
 */
export type StepsContextValue = {
  state: {
    /**
     * 現在のステップ番号（1 始まり）
     */
    current: number;
    /**
     * Steps の直下に描画されるステップの総数
     */
    total: number;
    /**
     * ステップの並び方向
     */
    orientation: StepsOrientation;
  };
  actions: {
    /**
     * ステップを選択する（ルートの `onClick` を呼ぶ）。
     *
     * ルートに `onClick` が渡されていないときは `undefined` になり、
     * ステップは非インタラクティブとして描画される
     */
    select?: (stepNumber: number) => void;
  };
};

export const StepsContext = createContext<StepsContextValue | null>(null);

/**
 * Steps の context を取得する。`<Steps>` の外側で呼ぶと例外を投げる
 */
export const useStepsContext = (): StepsContextValue => {
  const context = use(StepsContext);

  if (context === null) {
    throw new Error('Steps のサブコンポーネントは <Steps> の内側で使用してください');
  }

  return context;
};

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
