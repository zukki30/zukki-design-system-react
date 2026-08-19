import { steps, stepsItemContainer } from './Steps.css';
import { StepsItem } from './StepsItem';

/**
 * ステップの並び方向
 */
export type StepsOrientation = 'horizontal' | 'vertical';

type Props = {
  labels: string[];
  current: number;
  /**
   * ステップの並び方向
   * @default 'horizontal'
   */
  orientation?: StepsOrientation;
  onClick?: (stepNumber: number) => void;
};

export const Steps = ({ labels, current, orientation = 'horizontal', onClick }: Props) => {
  const isCurrent = (stepNumber: number) => {
    return stepNumber === current;
  };

  const isFinished = (stepNumber: number) => {
    return stepNumber < labels.length && stepNumber < current;
  };

  return (
    <ol className={steps[orientation]}>
      {labels.map((label, index) => (
        <li data-orientation={orientation} className={stepsItemContainer} key={label}>
          <StepsItem
            stepNumber={index + 1}
            label={label}
            current={isCurrent(index + 1)}
            finished={isFinished(index + 1)}
            onClick={onClick}
          />
        </li>
      ))}
    </ol>
  );
};
