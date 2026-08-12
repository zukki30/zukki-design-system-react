import { clsx } from 'clsx';
import type { ComponentProps, ComponentPropsWithoutRef, MouseEvent } from 'react';

import type { SizeType, ZukkiVariantType } from '@/types';

import { Spinner } from '../Spinner/Spinner';

import {
  button,
  buttonInner,
  buttonLabel,
  buttonLoading,
  buttonSize,
  buttonVariant,
} from './Button.css';

type Props = {
  /**
   * ボタンの中身
   */
  children: React.ReactNode;
  /**
   * ボタンの前に表示する要素
   */
  startIcon?: React.ReactNode;
  /**
   * ボタンの後に表示する要素
   */
  endIcon?: React.ReactNode;
  /**
   * ボタンのバリアント
   */
  variant?: 'default' | 'primary' | 'secondary' | 'success' | 'failure' | ZukkiVariantType;
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
} & Omit<ComponentPropsWithoutRef<'button'>, 'disabled' | 'prefix' | 'suffix'>;

const SPINNER_SIZES = {
  sm: '14px',
  md: '24px',
} as const satisfies Record<NonNullable<Props['size']>, ComponentProps<typeof Spinner>['width']>;

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
}: Props) => {
  const spinnerVariant: ComponentProps<typeof Spinner>['variant'] =
    variant === 'default' ? 'light' : 'dark';
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
      className={clsx(buttonSize[size], buttonVariant[variant], button, className)}
      disabled={disabled}
      data-selected={selected}
      data-has-start-icon={!!startIcon}
      data-has-end-icon={!!endIcon}
      data-loading={loading}
      // 処理中であることを支援技術に伝える（Spinner は視覚的な手がかりにすぎない）
      aria-busy={loading}
      {...props}
    >
      <span className={buttonInner} data-loading={loading}>
        {startIcon}
        <span className={buttonLabel[size]}>{children}</span>
        {endIcon}
      </span>

      {loading && (
        <span className={buttonLoading}>
          {/* 状態は aria-busy が伝えるため、Spinner は装飾として扱う
              （aria-label を渡すとアクセシブルネームに混ざってしまう） */}
          <Spinner variant={spinnerVariant} width={spinnerSize} height={spinnerSize} />
        </span>
      )}
    </button>
  );
};
