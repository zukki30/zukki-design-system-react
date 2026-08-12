import { Icon } from '../Icon';
import { stepsItem, stepsItemIcon, stepsItemLabel, stepsItemStatus } from './StepsItem.css';

const CHECK_ICON_SIZE = 20;

// props に依存しない静的な要素はモジュールスコープへ巻き上げ、再レンダーのたびに作り直さない
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

type Props = {
  /**
   * The step number to display.
   */
  stepNumber: number;
  /**
   * The label for the step.
   */
  label: string;
  /**
   * Whether the step is the current step.
   * If true, it will apply a different style to indicate it's the current step.
   */
  current?: boolean;
  /**
   * Whether the step is finished.
   * If true, it will display a check icon instead of the number.
   */
  finished?: boolean;
  /**
   * Optional click handler for the step.
   * If provided, the step will be clickable.
   */
  onClick?: (step: number) => void;
};

export const StepsItem = ({
  stepNumber,
  label,
  current = false,
  finished = false,
  onClick,
}: Props) => {
  const isNonInteractive = !onClick;
  const Component = isNonInteractive ? 'span' : 'button';
  const buttonProps = isNonInteractive
    ? {}
    : {
        type: 'button' as const,
        onClick: () => onClick(stepNumber),
      };

  const getStatusText = () => {
    if (finished) {
      return STATUS_TEXT.finished;
    }
    if (current) {
      return STATUS_TEXT.current;
    }
    return undefined;
  };

  const statusText = getStatusText();

  return (
    // 現在ステップは aria-current と状態テキストが重複して読み上げられるが、
    // aria-current を読み上げない支援技術のための保険として意図的に併記している
    <Component {...buttonProps} className={stepsItem} aria-current={current ? 'step' : undefined}>
      {finished ? (
        FINISHED_ICON
      ) : (
        <span className={current ? stepsItemIcon.current : stepsItemIcon.default}>
          {stepNumber}
        </span>
      )}
      <span className={stepsItemLabel}>{label}</span>
      {statusText !== undefined && <span className={stepsItemStatus}>{statusText}</span>}
    </Component>
  );
};
