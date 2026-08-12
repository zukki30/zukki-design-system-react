import { clsx } from 'clsx';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import { Icon } from '../Icon';

import {
  breadcrumb,
  breadcrumbCurrent,
  breadcrumbIcon,
  breadcrumbItem,
  breadcrumbLabel,
  breadcrumbLink,
  breadcrumbList,
  breadcrumbSeparator,
} from './Breadcrumb.css';

const SEPARATOR_ICON_SIZE = 20;

// props に依存しない静的な要素はモジュールスコープへ巻き上げ、項目ごとに作り直さない
const SEPARATOR_ICON = (
  <Icon
    className={breadcrumbSeparator}
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
   * ラベルの前に表示するアイコン（先頭項目の home アイコンなど）
   */
  icon?: ReactNode;
};

type Props = {
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
} & Omit<ComponentPropsWithoutRef<'nav'>, 'children'>;

export const Breadcrumb = ({
  items,
  variant = 'default',
  'aria-label': ariaLabel = 'パンくずリスト',
  className,
  ...props
}: Props) => {
  return (
    <nav className={clsx(breadcrumb, className)} aria-label={ariaLabel} {...props}>
      <ol className={breadcrumbList}>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          const key = `${index}-${item.href ?? ''}`;
          const content = (
            <>
              {item.icon !== undefined && <span className={breadcrumbIcon}>{item.icon}</span>}
              <span className={breadcrumbLabel}>{item.label}</span>
            </>
          );

          return (
            <li key={key} className={breadcrumbItem}>
              {isLast ? (
                <span className={breadcrumbCurrent[variant]} aria-current="page">
                  {content}
                </span>
              ) : item.href !== undefined ? (
                <a className={breadcrumbLink} href={item.href}>
                  {content}
                </a>
              ) : (
                <span className={breadcrumbLink}>{content}</span>
              )}

              {!isLast && SEPARATOR_ICON}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
