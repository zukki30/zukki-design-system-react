import type { Token } from 'style-dictionary';
import { describe, expect, it } from 'vitest';

import { transformSizePx } from './utils';

const token = (name: string, value: unknown) => ({ name, value }) as Token;

describe('transformSizePx', () => {
  describe('elevation', () => {
    // box-shadow の blur / spread に単位が付いていないと `var(--…)px` と書くほかなく、
    // カスタムプロパティの置換はトークン単位のため `8px` にならず宣言ごと破棄される
    it.each([
      ['elevation-styles-elevation2-x', 2, '2px'],
      ['elevation-styles-elevation2-y', 2, '2px'],
      ['elevation-styles-elevation2-blur', 4, '4px'],
      ['elevation-styles-elevation2-spread', 1, '1px'],
    ])('長さを表す %s に px を付ける', (name, value, expected) => {
      expect(transformSizePx(token(name, value))).toBe(expected);
    });

    // 0 は単位なしでも妥当な長さなので、そのまま出す
    it('値が 0 のときは単位を付けない', () => {
      expect(transformSizePx(token('elevation-styles-elevation2-x', 0))).toBe(0);
    });

    it.each([
      ['elevation-styles-elevation2-color', 'rgba(0, 0, 0, 0.15)'],
      ['elevation-styles-elevation2-type', 'dropShadow'],
    ])('長さではない %s はそのまま返す', (name, value) => {
      expect(transformSizePx(token(name, value))).toBe(value);
    });
  });

  describe('border-radius / spacing', () => {
    it.each([
      ['border-radius-xl', 16, '16px'],
      ['spacing-md', 8, '8px'],
    ])('%s に px を付ける', (name, value, expected) => {
      expect(transformSizePx(token(name, value))).toBe(expected);
    });

    it('値が 0 のときは単位を付けない', () => {
      expect(transformSizePx(token('border-radius-none', 0))).toBe(0);
      expect(transformSizePx(token('spacing-none', 0))).toBe(0);
    });

    // spacing には割合で持つものがあり、px を付けると無効値になる
    it('spacing の 0% はそのまま返す', () => {
      expect(transformSizePx(token('spacing-none', '0%'))).toBe('0%');
    });
  });

  it('対象外のトークンはそのまま返す', () => {
    expect(transformSizePx(token('font-weight-bold', 700))).toBe(700);
  });
});
