import { useCallback, useState } from 'react';

type UseIdRegistryResult = [ids: string[], register: (id: string) => () => void];

/**
 * 描画されたパーツの id を集める登録簿。
 *
 * パーツはルートの直下とは限らず、ルートからは children を検査して描画有無を知ることができない。
 * そのためパーツ側から id を登録してもらい、`htmlFor` や `aria-describedby` に反映する。
 *
 * `register` は登録解除用の関数を返すので、`useEffect` のクリーンアップにそのまま渡せる
 *
 * @example
 * const [helperTextIds, registerHelperText] = useIdRegistry();
 */
export const useIdRegistry = (): UseIdRegistryResult => {
  const [ids, setIds] = useState<string[]>([]);

  // 参照が変わるとパーツ側の登録用 useEffect が再実行されてしまうため、identity を固定する
  const register = useCallback((id: string) => {
    setIds((current) => [...current, id]);

    return () => setIds((current) => current.filter((registered) => registered !== id));
  }, []);

  return [ids, register];
};
