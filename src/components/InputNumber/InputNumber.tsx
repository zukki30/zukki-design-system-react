import { clsx } from 'clsx';
import { type ComponentPropsWithoutRef, type MouseEvent, useRef } from 'react';

import { Icon } from '../Icon';

import {
  inputNumber,
  inputNumberField,
  inputNumberSpin,
  inputNumberSpinButton,
  inputNumberSpinDivider,
} from './InputNumber.css';

type Props = {
  /**
   * 数値入力のエラー状態
   */
  error?: boolean;
  /**
   * 数値入力の disabled 属性
   */
  disabled?: boolean;
} & Omit<ComponentPropsWithoutRef<'input'>, 'type' | 'prefix' | 'suffix'>;

const ARROW_SIZE = 16;

const isFractional = (value: string | number | undefined): boolean => {
  if (value === undefined) {
    return false;
  }

  const parsed = Number(value);

  // 数値として解釈できない値は整数扱いに倒す
  return Number.isFinite(parsed) && !Number.isInteger(parsed);
};

/**
 * モバイルのソフトキーボードを出し分ける。
 *
 * 有効な値は「step base + step の倍数」なので、step が整数でも step base（min）が
 * 小数なら有効値は小数になる。判定には step と min の両方を見る。
 * value / defaultValue は入力中に変わりキーパッドが切り替わってしまうため見ない
 */
const resolveInputMode = (step: Props['step'], min: Props['min']): 'numeric' | 'decimal' => {
  // step 未指定時の既定値は 1（整数）
  if (step === 'any' || isFractional(step)) {
    return 'decimal';
  }

  return isFractional(min) ? 'decimal' : 'numeric';
};

/**
 * 数値入力。
 *
 * モバイルのソフトキーボードは `step` と `min` から自動で出し分ける
 * （小数を受け付けるなら `decimal`、それ以外は `numeric`）。
 *
 * どちらのキーパッドもマイナス記号を持たない環境があるため、
 * **負の値を受け付ける場合は `inputMode` を明示的に上書きすること**
 *
 * @example
 * <InputNumber min={-100} max={100} inputMode="text" />
 */
export const InputNumber = ({ error, disabled, className, ...props }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleStep = (direction: 'up' | 'down') => {
    const el = inputRef.current;
    if (!el || el.disabled) {
      return;
    }

    if (direction === 'up') {
      el.stepUp();
    } else {
      el.stepDown();
    }

    // stepUp/stepDown は input イベントを発火しないため、手動で発火して onChange に伝える
    el.dispatchEvent(new Event('input', { bubbles: true }));
  };

  // スピンボタン押下で入力のフォーカスを奪わないようにする
  const handleMouseDown = (event: MouseEvent) => {
    event.preventDefault();
  };

  return (
    <div className={clsx(inputNumber, className)} data-error={error} data-disabled={disabled}>
      <input
        ref={inputRef}
        type="number"
        // props より前に置いて、利用側から上書きできるようにする
        inputMode={resolveInputMode(props.step, props.min)}
        className={inputNumberField}
        disabled={disabled}
        aria-invalid={error}
        {...props}
      />

      <div className={inputNumberSpin}>
        <button
          type="button"
          tabIndex={-1}
          aria-label="増やす"
          className={inputNumberSpinButton}
          disabled={disabled}
          onMouseDown={handleMouseDown}
          onClick={() => handleStep('up')}
        >
          <Icon name="menuUp" width={ARROW_SIZE} height={ARROW_SIZE} />
        </button>

        <span className={inputNumberSpinDivider} />

        <button
          type="button"
          tabIndex={-1}
          aria-label="減らす"
          className={inputNumberSpinButton}
          disabled={disabled}
          onMouseDown={handleMouseDown}
          onClick={() => handleStep('down')}
        >
          <Icon name="menuDown" width={ARROW_SIZE} height={ARROW_SIZE} />
        </button>
      </div>
    </div>
  );
};
