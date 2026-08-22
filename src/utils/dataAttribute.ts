/**
 * `false` を `undefined` に潰す。
 *
 * React は `data-*` に `false` を渡すと `data-error="false"` という文字列を出力する。
 * CSS は `[data-error="true"]` で状態を拾うため、`false` の出力は DOM のノイズにしかならない。
 * 状態を `data-*` に渡す前にこの関数を通し、状態が立っているときだけ属性を出力する
 *
 * @example
 * <div data-error={toTruthyOrUndefined(error)} />
 */
export const toTruthyOrUndefined = (value: boolean | undefined): true | undefined =>
  value === true ? true : undefined;
