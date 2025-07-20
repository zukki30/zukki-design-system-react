// import { clsx } from 'clsx';
// import type { CSSProperties } from 'react';
import { Icon } from '../Icon';
import { stepsItem, stepsItemIcon, stepsItemLabel } from './StepsItem.css';

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
  const isClickable = !onClick;
  const Component = isClickable ? 'span' : 'button';
  const buttonProps = isClickable
    ? {}
    : {
        type: 'button' as const,
        onClick: () => onClick(stepNumber),
      };

  return (
    <Component {...buttonProps} className={stepsItem}>
      {finished ? (
        <span className={stepsItemIcon.finished}>
          <Icon name="outlineCheck" width={20} height={20} />
        </span>
      ) : (
        <span className={current ? stepsItemIcon.current : stepsItemIcon.default}>
          {stepNumber}
        </span>
      )}
      <span className={stepsItemLabel}>{label}</span>
    </Component>
  );
};
