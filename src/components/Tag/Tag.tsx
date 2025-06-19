import { clsx } from 'clsx';

import type { ZukkiVariantType } from '@/types';

import { Icon } from '../Icon';
import { tag, tagVariant, tagCloseButton, tagCloseButtonVariant } from './Tag.css';

type Props = {
  label: string;
  variant?: 'default' | 'red' | 'blue' | 'green' | 'yellow' | ZukkiVariantType;
  className?: string;
  onClose?: () => void;
};

const CLOSE_BUTTON_SIZE = 14;

export const Tag = ({ label, variant = 'default', className, onClose }: Props) => {
  return (
    <span className={clsx(tag, tagVariant[variant], className)}>
      {label}

      {onClose && (
        <button
          type="button"
          aria-label={`${label}を閉じる`}
          className={clsx(tagCloseButton, tagCloseButtonVariant[variant])}
          onClick={onClose}
        >
          <Icon name="close" width={CLOSE_BUTTON_SIZE} height={CLOSE_BUTTON_SIZE} />
        </button>
      )}
    </span>
  );
};
