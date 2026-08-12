import { clsx } from 'clsx';
import type { ComponentProps, ComponentPropsWithoutRef, MouseEvent } from 'react';

import type { SizeType } from '@/types';

import { Spinner } from '../Spinner/Spinner';

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

const SPINNER_VARIANTS = {
  primary: 'dark',
  secondary: 'dark',
  'primary-exposed': 'primary',
  'secondary-exposed': 'light',
} as const satisfies Record<
  NonNullable<Props['variant']>,
  ComponentProps<typeof Spinner>['variant']
>;

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
  const spinnerVariant = SPINNER_VARIANTS[variant];

  // CSS の pointer-events: none はマウスしか塞がないため、キーボード（Enter / Space）からの
  // 活性化もここで止める。disabled にはせず、フォーカス位置は保持する
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (loading) {
      return;
    }

    onClick?.(event);
  };

  return (
    <button
      type={type}
      onClick={handleClick}
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
          {/* 状態は aria-busy が伝えるため、Spinner は装飾として扱う */}
          <Spinner variant={spinnerVariant} width={SPINNER_SIZE} height={SPINNER_SIZE} />
        </span>
      )}
    </button>
  );
};
