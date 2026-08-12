import { steps, stepsItemContainer } from './Steps.css';
import { StepsItem } from './StepsItem';

type Props = {
  labels: string[];
  current: number;
  vertical?: boolean;
  onClick?: (stepNumber: number) => void;
};

export const Steps = ({ labels, current, vertical = false, onClick }: Props) => {
  const isCurrent = (stepNumber: number) => {
    return stepNumber === current;
  };

  const isFinished = (stepNumber: number) => {
    return stepNumber < labels.length && stepNumber < current;
  };

  return (
    <ol className={vertical ? steps.vertical : steps.horizontal}>
      {labels.map((label, index) => (
        <li data-vertical={vertical} className={stepsItemContainer} key={label}>
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
