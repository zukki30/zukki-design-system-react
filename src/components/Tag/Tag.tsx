import { clsx } from 'clsx';

import type { ZukkiVariantType } from '@/types';

import { Icon } from '../Icon/Icon';

import styles from './Tag.module.css';

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
    <span className={clsx(styles.tag, className)} data-variant={variant}>
      <span className={styles.tag__label}>{label}</span>

      {onClose && (
        <button
          type="button"
          aria-label={`${label}を閉じる`}
          className={styles.tag__closeButton}
          onClick={onClose}
        >
          {/* サイズは CSS が持つ（Tag.module.css の .tag__closeButton）。
              width / height を props で渡すと持ち主が 2 箇所になる */}
          <Icon name="close" />
        </button>
      )}
    </span>
  );
};
