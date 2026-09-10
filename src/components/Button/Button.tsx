import { clsx } from 'clsx';
import type { ComponentProps, ComponentPropsWithRef, MouseEvent, ReactNode } from 'react';

import type { SizeType, ZukkiVariantType } from '@/types';

import { Spinner } from '../Spinner/Spinner';

import styles from './Button.module.css';

/**
 * ボタンのバリアント。
 *
 * `default` は面の上に置く既定の見た目。`primary` / `secondary` / `success` /
 * `failure` は意味カラーの塗り。`profile` / `works` / `outputs` は zukki サイト
 * 固有のバリアント（{@link ZukkiVariantType}）
 */
export type ButtonVariant =
  'default' | 'primary' | 'secondary' | 'success' | 'failure' | ZukkiVariantType;

/**
 * ボタンのサイズ。`sm` / `md` の 2 段階。
 *
 * `lg` は意図的に持たない。大きく見せたいボタンはサイズではなく、置く側で
 * 幅を与えて表現する
 */
export type ButtonSize = Exclude<SizeType, 'lg'>;

export type ButtonProps = {
  /**
   * ボタンの中身
   */
  children: ReactNode;
  /**
   * ボタンの前に表示する要素
   */
  startIcon?: ReactNode;
  /**
   * ボタンの後に表示する要素
   */
  endIcon?: ReactNode;
  /**
   * ボタンのバリアント
   */
  variant?: ButtonVariant;
  /**
   * ボタンのサイズ
   */
  size?: ButtonSize;
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
} & Omit<ComponentPropsWithRef<'button'>, 'disabled' | 'prefix' | 'suffix'>;

const SPINNER_SIZES = {
  sm: '14px',
  md: '24px',
} as const satisfies Record<ButtonSize, ComponentProps<typeof Spinner>['width']>;

export const Button = ({
  children,
  startIcon,
  endIcon,
  variant = 'default',
  size = 'md',
  selected,
  disabled,
  loading,
  type = 'button',
  className,
  onClick,
  ...props
}: ButtonProps) => {
  const spinnerVariant: ComponentProps<typeof Spinner>['variant'] =
    variant === 'default' ? 'light' : 'accent';
  const spinnerSize = SPINNER_SIZES[size];

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
      className={clsx(styles.button, className)}
      disabled={disabled}
      data-variant={variant}
      data-size={size}
      data-selected={selected}
      data-has-start-icon={!!startIcon}
      data-has-end-icon={!!endIcon}
      data-loading={loading}
      // 処理中であることを支援技術に伝える（Spinner は視覚的な手がかりにすぎない）
      aria-busy={loading}
      {...props}
    >
      <span className={styles.button__inner} data-loading={loading}>
        {startIcon}
        <span className={styles.button__label}>{children}</span>
        {endIcon}
      </span>

      {loading && (
        <span className={styles.button__loading}>
          {/* 状態は aria-busy が伝えるため、Spinner は装飾として扱う
              （aria-label を渡すとアクセシブルネームに混ざってしまう） */}
          <Spinner variant={spinnerVariant} width={spinnerSize} height={spinnerSize} />
        </span>
      )}
    </button>
  );
};
