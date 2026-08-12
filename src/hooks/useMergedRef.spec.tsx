import { render, renderHook, screen } from '@testing-library/react';
import { createRef, type Ref } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useMergedRef } from './useMergedRef';

type ProbeProps = {
  refA?: Ref<HTMLInputElement>;
  refB?: Ref<HTMLInputElement>;
};

const Probe = ({ refA, refB }: ProbeProps) => {
  const mergedRef = useMergedRef(refA, refB);

  return <input ref={mergedRef} data-testid="probe" />;
};

describe('useMergedRef', () => {
  it('オブジェクト ref と関数 ref の両方に要素を渡す', () => {
    const objectRef = createRef<HTMLInputElement>();
    const functionRef = vi.fn();

    render(<Probe refA={objectRef} refB={functionRef} />);

    expect(objectRef.current).toBe(screen.getByTestId('probe'));
    expect(functionRef).toHaveBeenCalledWith(screen.getByTestId('probe'));
  });

  it('ref が未指定でも描画できる', () => {
    render(<Probe />);

    expect(screen.getByTestId('probe')).toBeInTheDocument();
  });

  it('ref に null を渡しても描画できる', () => {
    render(<Probe refA={null} refB={null} />);

    expect(screen.getByTestId('probe')).toBeInTheDocument();
  });

  it('アンマウント時にオブジェクト ref を null に戻す', () => {
    const objectRef = createRef<HTMLInputElement>();

    const { unmount } = render(<Probe refA={objectRef} />);
    unmount();

    expect(objectRef.current).toBeNull();
  });

  it('クリーンアップ関数を返さない関数 ref にはアンマウント時に null を渡す', () => {
    const functionRef = vi.fn();

    const { unmount } = render(<Probe refA={functionRef} />);
    unmount();

    expect(functionRef).toHaveBeenLastCalledWith(null);
  });

  it('関数 ref が返したクリーンアップ関数を呼び、null は渡さない', () => {
    const cleanup = vi.fn();
    const functionRef = vi.fn(() => cleanup);

    const { unmount } = render(<Probe refA={functionRef} />);

    expect(functionRef).toHaveBeenCalledTimes(1);

    unmount();

    expect(cleanup).toHaveBeenCalledTimes(1);
    expect(functionRef).toHaveBeenCalledTimes(1);
  });

  it('同じ ref を渡している間は同一の callback を返す', () => {
    const objectRef = createRef<HTMLInputElement>();
    const functionRef = vi.fn();

    const { result, rerender } = renderHook(() => useMergedRef(objectRef, functionRef));
    const initial = result.current;

    rerender();

    expect(result.current).toBe(initial);
  });

  it('渡された ref が変わると新しい callback を返す', () => {
    const functionRef = vi.fn();

    const { result, rerender } = renderHook(
      ({ refA }: { refA: Ref<HTMLInputElement> }) => useMergedRef(refA, functionRef),
      { initialProps: { refA: createRef<HTMLInputElement>() } }
    );
    const initial = result.current;

    rerender({ refA: createRef<HTMLInputElement>() });

    expect(result.current).not.toBe(initial);
  });
});
