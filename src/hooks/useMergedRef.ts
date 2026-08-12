import { useCallback } from 'react';
import type { Ref, RefCallback } from 'react';

type RefCleanup = () => void;

/**
 * ref に要素を割り当てる。
 * 関数 ref がクリーンアップ関数を返した場合は、そのまま呼び出し元へ返す（React 19 の ref cleanup）
 */
const attachRef = <T>(ref: Ref<T> | undefined, node: T | null): RefCleanup | undefined => {
  if (typeof ref === 'function') {
    const cleanup = ref(node);

    return typeof cleanup === 'function' ? cleanup : undefined;
  }

  if (ref != null) {
    ref.current = node;
  }

  return undefined;
};

/**
 * ref から要素を外す。
 * クリーンアップ関数を受け取っていればそれを呼び、なければ null を割り当てて解除する
 */
const detachRef = <T>(ref: Ref<T> | undefined, cleanup: RefCleanup | undefined) => {
  if (cleanup !== undefined) {
    cleanup();
    return;
  }

  attachRef(ref, null);
};

/**
 * 2 つの ref を 1 つの ref callback にまとめる。
 *
 * コンポーネントが内部で DOM 要素を参照しつつ、利用側から受け取った `ref` にも
 * 同じ要素を渡したいときに使う。関数 ref・オブジェクト ref・`undefined` のいずれも渡せる。
 *
 * 返す callback は refA / refB が変わらない限り同一なので、
 * 再レンダーのたびに ref が付け外しされることはない。
 *
 * @example
 * const inputRef = useRef<HTMLInputElement>(null);
 * const mergedRef = useMergedRef(ref, inputRef);
 *
 * return <input ref={mergedRef} />;
 */
export const useMergedRef = <T>(
  refA: Ref<T> | undefined,
  refB: Ref<T> | undefined
): RefCallback<T> =>
  useCallback(
    (node: T | null) => {
      const cleanupA = attachRef(refA, node);
      const cleanupB = attachRef(refB, node);

      return () => {
        detachRef(refA, cleanupA);
        detachRef(refB, cleanupB);
      };
    },
    [refA, refB]
  );
