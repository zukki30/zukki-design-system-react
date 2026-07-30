import { describe, expect, it } from 'vitest';

import { REDUCED_MOTION_QUERY, reducedMotion, reducedMotionNone } from './motion';

describe('REDUCED_MOTION_QUERY', () => {
  it('モーション低減のメディアクエリ条件を持つ', () => {
    expect(REDUCED_MOTION_QUERY).toBe('(prefers-reduced-motion: reduce)');
  });
});

describe('reducedMotion', () => {
  it('渡したスタイルをモーション低減のメディアクエリで包む', () => {
    expect(reducedMotion({ animation: 'none' })).toEqual({
      '@media': {
        [REDUCED_MOTION_QUERY]: { animation: 'none' },
      },
    });
  });

  it('複数の宣言をそのまま保持する', () => {
    expect(reducedMotion({ transition: 'none', animationDuration: '3s' })).toEqual({
      '@media': {
        '(prefers-reduced-motion: reduce)': { transition: 'none', animationDuration: '3s' },
      },
    });
  });

  it('空のスタイルでもメディアクエリを生成する', () => {
    expect(reducedMotion({})).toEqual({
      '@media': {
        '(prefers-reduced-motion: reduce)': {},
      },
    });
  });

  it('呼び出しごとに独立したオブジェクトを返す', () => {
    const first = reducedMotion({ animation: 'none' });
    const second = reducedMotion({ animation: 'none' });

    expect(first).not.toBe(second);
    expect(first['@media']).not.toBe(second['@media']);
  });
});

describe('reducedMotionNone', () => {
  it('トランジションとアニメーションを停止する', () => {
    expect(reducedMotionNone).toEqual({
      '@media': {
        '(prefers-reduced-motion: reduce)': { transition: 'none', animation: 'none' },
      },
    });
  });
});
