import { clsx } from 'clsx';
import { type ComponentProps, type ComponentPropsWithoutRef, useMemo } from 'react';

import type { SizeType } from '@/types';

import { Spinner } from '../Spinner';

import {
  iconButton,
  iconButtonInner,
  iconButtonLoading,
  iconButtonSize,
  iconButtonVariant,
} from './IconButton.css';

type Props = {
  /**
   * ボタンの中身
   */
  children: React.ReactNode;
  /**
   * ボタンのバリアント
   */
  variant?: 'primary' | 'secondary' | 'primary-exposed' | 'secondary-exposed';
  /**
   * ボタンのサイズ
   */
  size?: Exclude<SizeType, 'lg'>;
  /**
   * ボタンの selected 属性
   */
  selected?: boolean;
  /**
   * ボタンの disabled 属性
   */
  disabled?: boolean;
  /**
   * ボタンの loading 属性
   */
  loading?: boolean;
  /**
   * ボタンのアクセシブルネーム。
   * アイコンのみでラベルテキストを持たないため、省略できない
   */
  'aria-label': string;
} & Omit<ComponentPropsWithoutRef<'button'>, 'disabled' | 'prefix' | 'suffix' | 'aria-label'>;

const SPINNER_SIZE = 20;

export const IconButton = ({
  children,
  variant = 'primary',
  size = 'md',
  selected,
  disabled,
  loading,
  type = 'button',
  className,
  onClick,
  ...props
}: Props) => {
  const spinnerVariant: ComponentProps<typeof Spinner>['variant'] = useMemo(() => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'dark';
      case 'primary-exposed':
        return 'primary';
      case 'secondary-exposed':
        return 'light';
      default:
        return 'light';
    }
  }, [variant]);

  return (
    <button
      type={type}
      onClick={onClick}
      className={clsx(iconButtonSize[size], iconButtonVariant[variant], iconButton, className)}
      disabled={disabled}
      data-selected={selected}
      data-loading={loading}
      // 処理中であることを支援技術に伝える（Spinner は視覚的な手がかりにすぎない）
      aria-busy={loading}
      {...props}
    >
      <span className={iconButtonInner} data-loading={loading}>
        {children}
      </span>

      {loading && (
        <span className={iconButtonLoading}>
          <Spinner
            variant={spinnerVariant}
            width={SPINNER_SIZE}
            height={SPINNER_SIZE}
            aria-label="loading"
          />
        </span>
      )}
    </button>
  );
};
