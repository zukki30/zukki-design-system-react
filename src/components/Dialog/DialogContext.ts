import { createContext, use } from 'react';

/**
 * Dialog がサブコンポーネントへ共有する値。
 *
 * 利用側が独自のパーツ（フッターのキャンセルボタンなど）を作るときは
 * `useDialogContext()` からこの値を参照する
 */
export type DialogContextValue = {
  state: {
    /**
     * ダイアログの開閉状態
     */
    open: boolean;
  };
  actions: {
    /**
     * ダイアログを閉じる（ルートの `onClose` を呼ぶ）
     */
    close: () => void;
  };
  meta: {
    /**
     * タイトル要素の id をルートへ登録する。
     *
     * 登録された id はルートの `aria-labelledby` に反映される。
     * タイトルが無いときに `aria-labelledby` が宙に浮くのを防ぐために使う。
     * 戻り値は登録解除用の関数で、`useEffect` のクリーンアップにそのまま渡せる
     */
    registerTitle: (id: string) => () => void;
  };
};

export const DialogContext = createContext<DialogContextValue | null>(null);

/**
 * Dialog の context を取得する。`<Dialog>` の外側で呼ぶと例外を投げる
 */
export const useDialogContext = (): DialogContextValue => {
  const context = use(DialogContext);

  if (context === null) {
    throw new Error('Dialog のサブコンポーネントは <Dialog> の内側で使用してください');
  }

  return context;
};
