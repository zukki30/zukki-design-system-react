import { useEffect } from 'react';

/**
 * 現在ロックを要求している数。
 * Dialog が重なって開いても、最後の 1 つが閉じるまでロックを維持するために数える。
 */
let lockCount = 0;

/** ロック開始時の body インラインスタイル（解除時にこの値へ戻す） */
let restoreStyle: { overflow: string; paddingRight: string } | null = null;

const lockBodyScroll = () => {
  lockCount += 1;

  // すでにロック済みの場合、開始時のスタイルを上書きしない
  if (lockCount > 1) {
    return;
  }

  const { body } = document;
  restoreStyle = {
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  };

  // スクロールバーが消える分の幅を padding で補い、背景のガタつき（レイアウトシフト）を防ぐ
  const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
  if (scrollbarWidth > 0) {
    const currentPaddingRight = Number.parseFloat(getComputedStyle(body).paddingRight) || 0;
    body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
  }

  body.style.overflow = 'hidden';
};

const unlockBodyScroll = () => {
  lockCount -= 1;

  // まだ他にロックを要求している要素が残っている場合は解除しない
  if (lockCount > 0 || restoreStyle === null) {
    return;
  }

  document.body.style.overflow = restoreStyle.overflow;
  document.body.style.paddingRight = restoreStyle.paddingRight;
  restoreStyle = null;
};

/**
 * `locked` が true の間、body（背景）のスクロールを止める。
 *
 * ネイティブの `<dialog>` を `showModal()` で開いても背景ドキュメントのスクロールは
 * 抑止されないため、モーダル表示中はこのフックで明示的にロックする。
 * false になったとき・アンマウント時にはロック前のスタイルへ復帰する。
 *
 * @example
 * useBodyScrollLock(open);
 */
export const useBodyScrollLock = (locked: boolean) => {
  useEffect(() => {
    if (!locked) {
      return;
    }

    lockBodyScroll();

    return unlockBodyScroll;
  }, [locked]);
};
