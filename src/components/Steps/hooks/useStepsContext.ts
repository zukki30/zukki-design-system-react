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
