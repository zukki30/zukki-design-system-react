import { clsx } from 'clsx';
import { Children, Fragment, isValidElement, useMemo } from 'react';
import type { ComponentPropsWithRef, ReactNode } from 'react';

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
   *
   * ステップ番号を受け取る独自のハンドラのため、ol のネイティブな
   * `onClick` / `onClickCapture` は受け取らない
   */
  onClick?: (stepNumber: number) => void;
  /**
   * ステップの並び。ステップ番号は直下の子の並び順から採番されるため、
   * 1 ステップにつき 1 つの子を置く
   */
  children: ReactNode;
  // キャプチャ側だけネイティブのまま残すと、同じ「クリック」の名前で
  // 一方はステップ番号・他方は MouseEvent を受け取る食い違いが型から見えなくなる
} & Omit<ComponentPropsWithRef<'ol'>, 'onClick' | 'onClickCapture'>;

/**
 * 手順の進捗を示すステップ。ステップは Steps.Item を並べて構成する。
 * ステップ番号は Steps が並び順から採番し、現在／完了の状態とあわせて context 経由で共有される
 *
 * 現在のステップは色に加えてラベルの太字でも示すため、色だけに頼らずに見分けられる
 *
 * ref とネイティブ属性はルートの ol に転送される
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
export function Steps({
  current,
  orientation = 'horizontal',
  onClick,
  className,
  children,
  ...props
}: StepsProps) {
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
      <ol {...props} className={clsx(steps[orientation], className)}>
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
