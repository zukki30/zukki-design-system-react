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
     * タイトル要素に付与する id。ルートの `aria-labelledby` と対応する
     */
    titleId: string;
    /**
     * `Dialog.Title` の有無をルートへ登録する。
     * タイトルが無いときに `aria-labelledby` が宙に浮くのを防ぐために使う
     */
    registerTitle: (registered: boolean) => void;
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
