import type { HeadingLevel } from '@/types';

/**
 * 見出しレベルから見出し要素のタグ名を返す。
 *
 * タイトルのパーツは `level` prop で見出しレベルを受け取り、その値に応じて
 * `h2`〜`h6` を出し分ける。テンプレートリテラル型で返すことで、
 * 描画側では `'h2' | 'h3' | 'h4' | 'h5' | 'h6'` として扱える。
 *
 * 描画は JSX ではなく `createElement()` で行う。JSX で書くには戻り値を大文字始まりの
 * 変数へ入れる必要があり、`react-hooks/static-components` に
 * 「レンダーごとにコンポーネントを作っている」と誤検知されるため
 *
 * @example
 * return createElement(headingTag(level), { ...props, className });
 */
export const headingTag = (level: HeadingLevel) => `h${level}` as const;
