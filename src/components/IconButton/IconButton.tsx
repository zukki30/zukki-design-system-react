import { clsx } from 'clsx';
import type { ComponentProps, ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';

import type { SizeType } from '@/types';

import { Spinner } from '../Spinner/Spinner';

import styles from './IconButton.module.css';

/**
 * アイコンボタンのバリアント。
 *
 * `primary` / `secondary` は塗りのある見た目。`-exposed` は塗りを持たず、
 * 面の上に直接アイコンを置く見た目
 */
export type IconButtonVariant = 'primary' | 'secondary' | 'primary-exposed' | 'secondary-exposed';

/**
 * アイコンボタンのサイズ。`sm` / `md` の 2 段階。
 *
 * `lg` は意図的に持たない。タッチ領域は `md` で確保しているため、
 * それ以上に大きくする必要がない
 */
export type IconButtonSize = Exclude<SizeType, 'lg'>;

export type IconButtonProps = {
  /**
   * ボタンの中身
   */
  children: ReactNode;
  /**
   * ボタンのバリアント
   */
  variant?: IconButtonVariant;
  /**
   * ボタンのサイズ
   */
  size?: IconButtonSize;
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
} & Omit<ComponentPropsWithRef<'button'>, 'disabled' | 'prefix' | 'suffix' | 'aria-label'>;

const SPINNER_SIZE = 20;

const SPINNER_VARIANTS = {
  primary: 'dark',
  secondary: 'dark',
  'primary-exposed': 'primary',
  'secondary-exposed': 'light',
} as const satisfies Record<IconButtonVariant, ComponentProps<typeof Spinner>['variant']>;

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
}: IconButtonProps) => {
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
      className={clsx(styles.iconButton, className)}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      data-selected={selected}
      data-loading={loading}
      // 処理中であることを支援技術に伝える（Spinner は視覚的な手がかりにすぎない）
      aria-busy={loading}
      {...props}
    >
      <span className={styles.iconButton__inner} data-loading={loading}>
        {children}
      </span>

      {loading && (
        <span className={styles.iconButton__loading}>
          {/* 状態は aria-busy が伝えるため、Spinner は装飾として扱う */}
          <Spinner variant={spinnerVariant} width={SPINNER_SIZE} height={SPINNER_SIZE} />
        </span>
      )}
    </button>
  );
};
