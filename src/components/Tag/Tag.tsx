import { clsx } from 'clsx';

import type { ZukkiVariantType } from '@/types';

import { Icon } from '../Icon';
// import { skeleton } from './Tag.css';

type Props = {
  label: string;
  variant?: 'default' | 'red' | 'blue' | 'green' | 'yellow' | ZukkiVariantType;
  className?: string;
  onClose?: () => void;
};

const CLOSE_BUTTON_SIZE = 14;

export const Tag = ({ label, variant = 'default', className, onClose }: Props) => {
  return (
    <span className={clsx(className)}>
      {label}

      {onClose && (
        <button type="button" aria-label={`${label}を閉じる`} onClick={onClose}>
          <Icon name="close" width={CLOSE_BUTTON_SIZE} height={CLOSE_BUTTON_SIZE} />
        </button>
      )}
    </span>
  );
};
