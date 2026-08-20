import type { ReactNode } from 'react';

import { Icon } from '../Icon/Icon';
import { stepsItemContainer } from './Steps.css';
import { stepsItem, stepsItemIcon, stepsItemLabel, stepsItemStatus } from './StepsItem.css';
import { useStepsContext, useStepsItemNumber } from './hooks';

const CHECK_ICON_SIZE = 20;

// 静的な要素は巻き上げる
const FINISHED_ICON = (
  <span className={stepsItemIcon.finished}>
    <Icon name="outlineCheck" width={CHECK_ICON_SIZE} height={CHECK_ICON_SIZE} />
  </span>
);

/**
 * 状態を色・アイコンだけでなくテキストでも伝えるための文言（視覚的には非表示）
 *
 * 完了アイコンは装飾（`aria-hidden`）のままにして、完了・現在のどちらもこのテキストで
 * 伝えることで、読み上げの順序（ラベル → 状態）を状態間で揃えている。
 */
const STATUS_TEXT = {
  finished: '完了',
  current: '現在のステップ',
} as const;

export type StepsItemProps = {
  /**
   * ステップのラベル
   */
  children: ReactNode;
};

/**
 * ステップ 1 件。ステップ番号・現在／完了の状態・クリック可否は、
 * すべて Steps から context 経由で受け取る
 */
export const StepsItem = ({ children }: StepsItemProps) => {
  const { current, orientation, total, onClick } = useStepsContext('Steps.Item');
  const stepNumber = useStepsItemNumber('Steps.Item');

  const isCurrent = stepNumber === current;
  // 最終ステップは current を超えても完了にしない（次のステップが存在しないため）
  const isFinished = stepNumber < total && stepNumber < current;

  const isNonInteractive = !onClick;
  const Component = isNonInteractive ? 'span' : 'button';
  const buttonProps = isNonInteractive
    ? {}
    : {
        type: 'button' as const,
        onClick: () => onClick(stepNumber),
      };

  const getStatusText = () => {
    if (isFinished) {
      return STATUS_TEXT.finished;
    }
    if (isCurrent) {
      return STATUS_TEXT.current;
    }
    return undefined;
  };

  const statusText = getStatusText();

  return (
    <li data-orientation={orientation} className={stepsItemContainer}>
      {/* 現在ステップは aria-current と状態テキストが重複して読み上げられるが、
          aria-current を読み上げない支援技術のための保険として意図的に併記している */}
      <Component
        {...buttonProps}
        className={stepsItem}
        aria-current={isCurrent ? 'step' : undefined}
      >
        {isFinished ? (
          FINISHED_ICON
        ) : (
          <span className={isCurrent ? stepsItemIcon.current : stepsItemIcon.default}>
            {stepNumber}
          </span>
        )}
        <span className={stepsItemLabel}>{children}</span>
        {statusText !== undefined && <span className={stepsItemStatus}>{statusText}</span>}
      </Component>
    </li>
  );
};
