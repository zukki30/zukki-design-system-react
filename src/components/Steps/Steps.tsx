import { Children, isValidElement, useMemo } from 'react';
import type { ReactNode } from 'react';

import { steps } from './Steps.css';
import { StepsItem } from './StepsItem';
import { StepsContext, StepsItemNumberContext } from './hooks';
import type { StepsContextValue, StepsOrientation } from './hooks';

export type StepsProps = {
  /**
   * 現在のステップ番号（1 始まり）。
   * これより小さい番号のステップは完了として描画される
   */
  current: number;
  /**
   * ステップの並び方向
   * @default 'horizontal'
   */
  orientation?: StepsOrientation;
  /**
   * ステップをクリックしたときに呼ばれるハンドラ。
   * 指定するとステップがボタンとして描画される
   */
  onClick?: (stepNumber: number) => void;
  /**
   * ステップの並び。直下には Steps.Item のみを指定する
   */
  children: ReactNode;
};

/**
 * 手順の進捗を示すステップ。ステップは Steps.Item を並べて構成する。
 * ステップ番号は Steps が並び順から採番し、現在／完了の状態とあわせて context 経由で共有される
 *
 * @example
 * ```tsx
 * <Steps current={2}>
 *   <Steps.Item>カート</Steps.Item>
 *   <Steps.Item>配送先</Steps.Item>
 *   <Steps.Item>確認</Steps.Item>
 * </Steps>
 * ```
 */
export const Steps = ({ current, orientation = 'horizontal', onClick, children }: StepsProps) => {
  // 採番に使う。Children.count と違い null や false の子は取り除かれるので、
  // 条件付きで描画しないステップが番号を消費することはない
  const items = Children.toArray(children);

  // context の value が毎レンダー新しい参照になると、children が変わっていなくても
  // Steps.Item の再レンダーが走るため、共有する値が変わったときだけ更新する。
  // items.length を依存に置くと React Compiler がメモ化を保てないため、総数は中で数え直す
  const contextValue = useMemo<StepsContextValue>(
    () => ({ current, orientation, total: Children.toArray(children).length, onClick }),
    [current, orientation, children, onClick]
  );

  return (
    <StepsContext value={contextValue}>
      <ol className={steps[orientation]}>
        {items.map((item, index) => {
          // 番号を並び順から決める以上、Steps.Item 以外を挟むと採番がずれる。
          // 静かにずれるより、使い方の誤りとして例外を投げる
          if (!isValidElement(item) || item.type !== StepsItem) {
            throw new Error(
              'Steps の直下には Steps.Item のみ指定できます。Fragment や独自のラッパーで包むとステップ番号がずれます。'
            );
          }

          return (
            // ラベルは重複しうるため key にできない。ステップの同一性は並び順そのものなので index を使う
            <StepsItemNumberContext key={index} value={index + 1}>
              {item}
            </StepsItemNumberContext>
          );
        })}
      </ol>
    </StepsContext>
  );
};

Steps.Item = StepsItem;
