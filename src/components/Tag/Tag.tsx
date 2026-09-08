import { clsx } from 'clsx';

import type { ZukkiVariantType } from '@/types';

import { Icon } from '../Icon/Icon';
import {
  tag,
  tagLabel,
  tagVariant,
  tagCloseButton,
  tagCloseButtonVariant,
  CLOSE_BUTTON_SIZE,
} from './Tag.css';

export type TagVariant = 'default' | 'red' | 'blue' | 'green' | 'yellow' | ZukkiVariantType;

export type TagProps = {
  /**
   * タグに表示するテキスト。
   * 閉じるボタンのアクセシブルネーム（`〜を閉じる`）にも使う
   */
  label: string;
  /**
   * タグのバリアント
   */
  variant?: TagVariant;
  /**
   * 追加のクラス名
   */
  className?: string;
  /**
   * 閉じるボタンを押したときに呼ばれる。
   * 渡さないと閉じるボタン自体を描画しない
   */
  onClose?: () => void;
};

export const Tag = ({ label, variant = 'default', className, onClose }: TagProps) => {
  return (
    <span className={clsx(tag, tagVariant[variant], className)}>
      <span className={tagLabel}>{label}</span>

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
