import { clsx } from 'clsx';
import type { ComponentPropsWithRef, ReactNode } from 'react';

import { Icon } from '../Icon/Icon';

import styles from './Breadcrumb.module.css';

const SEPARATOR_ICON_SIZE = 20;

// 静的な要素は巻き上げる。ここは items.map() の中なので項目数ぶん生成を減らせる
const SEPARATOR_ICON = (
  <Icon
    className={styles.breadcrumb__separator}
    name="chevronRight"
    width={SEPARATOR_ICON_SIZE}
    height={SEPARATOR_ICON_SIZE}
  />
);

/**
 * 現在地（末尾項目）の色テーマ
 */
export type BreadcrumbVariant = 'default' | 'profile' | 'works' | 'outputs';

export type BreadcrumbItem = {
  /**
   * 表示ラベル
   */
  label: ReactNode;
  /**
   * リンク先。指定すると a 要素として描画する（末尾項目では無視される）
   */
  href?: string;
  /**
   * ラベルの前に表示するアイコン（先頭項目の home アイコンなど）。
   * `0` や `''` などの falsy な値はアイコン未指定として扱い、何も描画しない
   */
  icon?: ReactNode;
};

export type BreadcrumbProps = {
  /**
   * パンくずの項目。配列の末尾が現在地として扱われる
   */
  items: BreadcrumbItem[];
  /**
   * 現在地の色テーマ
   * @default 'default'
   */
  variant?: BreadcrumbVariant;
  /**
   * nav 要素の aria-label
   * @default 'パンくずリスト'
   */
  'aria-label'?: string;
} & Omit<ComponentPropsWithRef<'nav'>, 'children'>;

export const Breadcrumb = ({
  items,
  variant = 'default',
  'aria-label': ariaLabel = 'パンくずリスト',
  className,
  ...props
}: BreadcrumbProps) => {
  return (
    <nav
      className={clsx(styles.breadcrumb, className)}
      aria-label={ariaLabel}
      {...props}
      data-variant={variant}
    >
      <ol className={styles.breadcrumb__list}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const key = `${index}-${item.href ?? ''}`;
          const content = (
            <>
              {item.icon ? <span className={styles.breadcrumb__icon}>{item.icon}</span> : null}
              <span className={styles.breadcrumb__label}>{item.label}</span>
            </>
          );

          return (
            <li key={key} className={styles.breadcrumb__item}>
              {isLast ? (
                <span className={styles.breadcrumb__current} aria-current="page">
                  {content}
                </span>
              ) : item.href != null ? (
                <a className={styles.breadcrumb__link} href={item.href}>
                  {content}
                </a>
              ) : (
                <span className={styles.breadcrumb__link}>{content}</span>
              )}

              {!isLast && SEPARATOR_ICON}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
