import { clsx } from 'clsx';
import {
  type ComponentPropsWithRef,
  type CSSProperties,
  type ReactNode,
  useEffect,
  useId,
  useRef,
  useState,
} from 'react';

import { tooltip, tooltipArrow, tooltipPopup } from './Tooltip.css';

/**
 * CSS カスタム識別子に使えない文字。
 * レンダーごとに生成しないようモジュールスコープへ置く（`replace` は lastIndex を持ち越さない）
 */
const INVALID_CUSTOM_IDENT_CHARS = /[^a-zA-Z0-9_-]/g;

/**
 * 吹き出しの表示位置
 */
export type TooltipPlacement =
  'top' | 'topLeft' | 'topRight' | 'bottom' | 'bottomLeft' | 'bottomRight' | 'left' | 'right';

type Props = {
  /**
   * 吹き出しに表示する内容
   */
  content: ReactNode;
  /**
   * 吹き出しの表示位置
   * @default 'top'
   */
  placement?: TooltipPlacement;
  /**
   * 吹き出しを常に表示する（未指定時はホバー・フォーカスで表示）
   */
  open?: boolean;
  /**
   * ツールチップを付与する対象要素
   */
  children: ReactNode;
} & Omit<ComponentPropsWithRef<'span'>, 'content'>;

export const Tooltip = ({
  content,
  placement = 'top',
  open,
  children,
  className,
  style,
  ...props
}: Props) => {
  const rawId = useId();
  // useId が返す文字列には CSS カスタム識別子として使えない文字（`:` など）が含まれるため除去する
  const anchorName = `--tooltip-anchor-${rawId.replace(INVALID_CUSTOM_IDENT_CHARS, '')}`;

  const popupRef = useRef<HTMLSpanElement>(null);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);

  // open が指定されていれば常に表示、未指定ならホバー・フォーカスで表示する
  const visible = open === true || hovered || focused;

  useEffect(() => {
    const el = popupRef.current;
    // Popover API 非対応環境（テスト用 jsdom など）では何もしない
    if (!el || typeof el.showPopover !== 'function') {
      return;
    }

    try {
      if (visible) {
        el.showPopover();
      } else {
        el.hidePopover();
      }
    } catch {
      // すでに表示／非表示状態のときに呼ぶと例外になるため握りつぶす
    }
  }, [visible]);

  return (
    <span
      className={clsx(tooltip, className)}
      style={{ ...style, anchorName } as CSSProperties}
      data-open={open}
      aria-describedby={rawId}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      {...props}
    >
      {children}

      <span
        ref={popupRef}
        popover="manual"
        className={tooltipPopup}
        role="tooltip"
        id={rawId}
        data-placement={placement}
        style={{ positionAnchor: anchorName } as CSSProperties}
      >
        {content}
        <span className={tooltipArrow} aria-hidden="true" />
      </span>
    </span>
  );
};
