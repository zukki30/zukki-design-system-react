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

/**
 * モバイルのソフトキーボードを出し分ける。
 * step が小数（または 'any'）を許すときだけ小数点付きのキーパッドにする。
 *
 * numeric / decimal のどちらもマイナス記号を持たない環境があるため、
 * 負値を受け付ける入力では利用側から `inputMode` を上書きすること
 */
const resolveInputMode = (step: Props['step']): 'numeric' | 'decimal' => {
  // step 未指定時の既定値は 1 なので整数のみ
  if (step === undefined) {
    return 'numeric';
  }
  if (step === 'any') {
    return 'decimal';
  }

  const parsed = Number(step);

  return Number.isFinite(parsed) && !Number.isInteger(parsed) ? 'decimal' : 'numeric';
};

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
        inputMode={resolveInputMode(props.step)}
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
