import { useCallback, useState } from 'react';

type UseIdRegistryResult = [ids: string[], register: (id: string) => () => void];

/**
 * 描画されたパーツの id を集める登録簿。
 *
 * compound components では、パーツはルートの直下とは限らず、
 * ルートからは children を検査して描画有無を知ることができない。
 * そのためパーツ側から id を登録してもらい、`aria-labelledby` や
 * `aria-describedby` などの参照に反映する。
 *
 * `register` は登録解除用の関数を返すので、`useEffect` のクリーンアップにそのまま渡せる
 *
 * @example
 * const [titleIds, registerTitle] = useIdRegistry();
 *
 * // パーツ側
 * useEffect(() => registerTitle(titleId), [registerTitle, titleId]);
 */
export const useIdRegistry = (): UseIdRegistryResult => {
  const [ids, setIds] = useState<string[]>([]);

  // 参照が変わるとパーツ側の登録用 useEffect が再実行されてしまうため、identity を固定する
  const register = useCallback((id: string) => {
    setIds((current) => [...current, id]);

    // 同じ id が複数登録されている場合に備えて、取り除くのは 1 件だけにする
    // （id で filter すると、1 つの解除で同じ id の登録がすべて消えてしまう）
    return () =>
      setIds((current) => {
        const index = current.indexOf(id);

        if (index === -1) {
          return current;
        }

        return [...current.slice(0, index), ...current.slice(index + 1)];
      });
  }, []);

  return [ids, register];
};
