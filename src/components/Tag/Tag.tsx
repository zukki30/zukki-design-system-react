import { clsx } from 'clsx';

import type { ZukkiVariantType } from '@/types';

import { Icon } from '../Icon';
import {
  tag,
  tagVariant,
  tagCloseButton,
  tagCloseButtonVariant,
  CLOSE_BUTTON_SIZE,
} from './Tag.css';

export type TagVariant = 'default' | 'red' | 'blue' | 'green' | 'yellow' | ZukkiVariantType;

type Props = {
  label: string;
  variant?: TagVariant;
  className?: string;
  onClose?: () => void;
};

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
