import { Children, Fragment, isValidElement, useMemo } from 'react';
import type { ReactNode } from 'react';

import { steps } from './Steps.css';
import { StepsItem } from './StepsItem';
import { StepsContext, StepsItemNumberContext } from './StepsContext';
import type { StepsContextValue, StepsOrientation } from './StepsContext';

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
   * ステップの並び。ステップ番号は直下の子の並び順から採番されるため、
   * 1 ステップにつき 1 つの子を置く
   */
  children: ReactNode;
};

/**
 * 手順の進捗を示すステップ。ステップは Steps.Item を並べて構成する。
 * ステップ番号は Steps が並び順から採番し、現在／完了の状態とあわせて context 経由で共有される
 *
 * 現在のステップは色に加えてラベルの太字でも示すため、色だけに頼らずに見分けられる
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
export function Steps({ current, orientation = 'horizontal', onClick, children }: StepsProps) {
  // 採番に使う。Children.count と違い null や false の子は取り除かれるので、
  // 条件付きで描画しないステップが番号を消費することはない
  const items = useMemo(() => Children.toArray(children), [children]);
  const total = items.length;

  // context の value が毎レンダー新しい参照になると、children が変わっていなくても
  // サブコンポーネントの再レンダーが走るため、共有する値が変わったときだけ更新する
  const contextValue = useMemo<StepsContextValue>(
    () => ({ state: { current, total, orientation }, actions: { select: onClick } }),
    [current, total, orientation, onClick]
  );

  return (
    <StepsContext value={contextValue}>
      <ol className={steps[orientation]}>
        {items.map((item, index) => {
          // Fragment は複数のステップが 1 つの子にまとまるため、採番が静かにずれる。
          // 独自のパーツは許容したいので、弾くのは採番が必ず壊れる Fragment だけにする
          if (isValidElement(item) && item.type === Fragment) {
            throw new Error(
              'Steps の直下に Fragment は置けません。ステップ番号は直下の子の並び順から採番されるため、1 ステップにつき 1 つの子を置いてください。'
            );
          }

          return (
            // Children.toArray が振り直したキーをそのまま使う。
            // 利用側が key を付けていれば、ステップの並び替えでも同一性が保たれる
            <StepsItemNumberContext key={isValidElement(item) ? item.key : index} value={index + 1}>
              {item}
            </StepsItemNumberContext>
          );
        })}
      </ol>
    </StepsContext>
  );
}

Steps.Item = StepsItem;
