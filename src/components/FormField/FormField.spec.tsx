import { render, screen } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { Checkbox } from '../Checkbox';
import { Input } from '../Input';

import { FormField } from './FormField';

describe('FormField', () => {
  it('ラベルと入力要素を描画する', () => {
    render(
      <FormField>
        <FormField.Label>ラベル</FormField.Label>
        <FormField.Control>
          <input />
        </FormField.Control>
      </FormField>
    );

    expect(screen.getByText('ラベル')).toBeInTheDocument();
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });

  it('ラベルを描画しなければラベルは出力されない', () => {
    render(
      <FormField>
        <FormField.Control>
          <input aria-label="入力" />
        </FormField.Control>
      </FormField>
    );

    expect(screen.queryByText('ラベル')).not.toBeInTheDocument();
  });

  it('orientation を data 属性に反映する（デフォルト horizontal）', () => {
    const { rerender } = render(
      <FormField>
        <FormField.Label>ラベル</FormField.Label>
      </FormField>
    );

    expect(screen.getByText('ラベル').closest('[data-orientation]')).toHaveAttribute(
      'data-orientation',
      'horizontal'
    );

    rerender(
      <FormField orientation="vertical">
        <FormField.Label>ラベル</FormField.Label>
      </FormField>
    );

    expect(screen.getByText('ラベル').closest('[data-orientation]')).toHaveAttribute(
      'data-orientation',
      'vertical'
    );
  });

  it('ネイティブ属性を div に渡す', () => {
    render(<FormField data-testid="field" />);

    expect(screen.getByTestId('field')).toBeInTheDocument();
  });

  it('ref を div に転送する', () => {
    const ref = createRef<HTMLDivElement>();
    render(<FormField ref={ref} data-testid="field" />);

    expect(ref.current).toBe(screen.getByTestId('field'));
  });

  it('サブコンポーネントを FormField の外側で使うと例外を投げる', () => {
    // 例外時に React が出力するエラーログでテスト結果が埋もれないよう抑止する
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<FormField.Label>ラベル</FormField.Label>)).toThrow(
      'FormField のサブコンポーネントは <FormField> の内側で使用してください'
    );

    consoleError.mockRestore();
  });

  describe('必須マーク', () => {
    it('required が false のとき必須マークを描画しない', () => {
      render(
        <FormField>
          <FormField.Label>ラベル</FormField.Label>
        </FormField>
      );

      expect(screen.queryByText('必須')).not.toBeInTheDocument();
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('requiredMark="badge" のとき必須バッジのみ描画する', () => {
      render(
        <FormField required requiredMark="badge">
          <FormField.Label>ラベル</FormField.Label>
        </FormField>
      );

      expect(screen.getByText('必須')).toBeInTheDocument();
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });

    it('requiredMark="asterisk" のときアスタリスクのみ描画する', () => {
      render(
        <FormField required requiredMark="asterisk">
          <FormField.Label>ラベル</FormField.Label>
        </FormField>
      );

      expect(screen.getByText('*')).toBeInTheDocument();
      expect(screen.queryByText('必須')).not.toBeInTheDocument();
    });

    it('requiredMark="both" のとき両方の必須マークを描画する', () => {
      render(
        <FormField required requiredMark="both">
          <FormField.Label>ラベル</FormField.Label>
        </FormField>
      );

      expect(screen.getByText('必須')).toBeInTheDocument();
      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('requiredMark のデフォルトはバッジ表示', () => {
      render(
        <FormField required>
          <FormField.Label>ラベル</FormField.Label>
        </FormField>
      );

      expect(screen.getByText('必須')).toBeInTheDocument();
      expect(screen.queryByText('*')).not.toBeInTheDocument();
    });
  });

  describe('ラベルと入力要素の紐付け', () => {
    it('id を指定しなくてもラベルと入力要素が紐付く', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
        </FormField>
      );

      // 紐付いていなければ getByLabelText が失敗する
      expect(screen.getByLabelText('名前')).toHaveAttribute('id');
    });

    it('入力要素が自前の id を持つときはその id で紐付ける', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input id="custom-id" />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByLabelText('名前')).toHaveAttribute('id', 'custom-id');
    });

    it('Input のようなラッパーコンポーネントにも配線が届く', () => {
      render(
        <FormField required>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <Input />
          </FormField.Control>
          <FormField.HelperText>全角で入力してください</FormField.HelperText>
        </FormField>
      );

      const control = screen.getByRole('textbox');
      expect(control).toHaveAttribute('aria-required', 'true');
      expect(control).toHaveAccessibleDescription('全角で入力してください');
      expect(screen.getByText('名前').closest('label')).toHaveAttribute(
        'for',
        control.getAttribute('id')
      );
    });

    it('入力要素が無いときはラベルの for を出力しない', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
        </FormField>
      );

      expect(screen.getByText('名前')).not.toHaveAttribute('for');
    });

    it('Control の子が単一要素でないときは id を注入せずラベルも紐付けない', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input aria-label="姓" />
            <input aria-label="名" />
          </FormField.Control>
          <FormField.HelperText>補助テキスト</FormField.HelperText>
        </FormField>
      );

      expect(screen.getByLabelText('姓')).not.toHaveAttribute('id');
      expect(screen.getByLabelText('姓')).not.toHaveAttribute('aria-describedby');
      expect(screen.getByLabelText('名')).not.toHaveAttribute('id');
      // 存在しない id を指すラベルを出力しない
      expect(screen.getByText('名前')).not.toHaveAttribute('for');
    });

    it('Control の子が単一の Fragment のときは注入しない', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <>
              <input aria-label="入力" />
            </>
          </FormField.Control>
          <FormField.HelperText>補助テキスト</FormField.HelperText>
        </FormField>
      );

      expect(screen.getByLabelText('入力')).not.toHaveAttribute('id');
      expect(screen.getByLabelText('入力')).not.toHaveAttribute('aria-describedby');
      expect(screen.getByText('名前')).not.toHaveAttribute('for');
    });

    it('Control の子がテキストのときもそのまま描画する', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>テキスト</FormField.Control>
        </FormField>
      );

      expect(screen.getByText('テキスト')).toBeInTheDocument();
      expect(screen.getByText('名前')).not.toHaveAttribute('for');
    });

    it('入力要素が外れるとラベルの for も外れる', () => {
      const { rerender } = render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByText('名前')).toHaveAttribute('for');

      rerender(
        <FormField>
          <FormField.Label>名前</FormField.Label>
        </FormField>
      );

      expect(screen.getByText('名前')).not.toHaveAttribute('for');
    });
  });

  describe('説明テキストの紐付け', () => {
    it('HelperText を aria-describedby で入力要素に紐付ける', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
          <FormField.HelperText>全角で入力してください</FormField.HelperText>
        </FormField>
      );

      expect(screen.getByLabelText('名前')).toHaveAccessibleDescription('全角で入力してください');
    });

    it('ErrorText を aria-describedby で紐付け、role="alert" で通知する', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
          <FormField.ErrorText>必須項目です</FormField.ErrorText>
        </FormField>
      );

      expect(screen.getByLabelText('名前')).toHaveAccessibleDescription('必須項目です');
      expect(screen.getByRole('alert')).toHaveTextContent('必須項目です');
    });

    it('role は利用側から上書きできる', () => {
      render(
        <FormField>
          <FormField.ErrorText role="status">必須項目です</FormField.ErrorText>
        </FormField>
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
      expect(screen.getByRole('status')).toHaveTextContent('必須項目です');
    });

    it('補助テキスト・エラーメッセージの順に aria-describedby へ含める', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
          {/* 描画順を入れ替えても読み上げ順は変わらない */}
          <FormField.ErrorText>必須項目です</FormField.ErrorText>
          <FormField.HelperText>全角で入力してください</FormField.HelperText>
        </FormField>
      );

      expect(screen.getByLabelText('名前')).toHaveAccessibleDescription(
        '全角で入力してください 必須項目です'
      );
    });

    it('入力要素側の aria-describedby を残して結合する', () => {
      render(
        <>
          <FormField>
            <FormField.Label>名前</FormField.Label>
            <FormField.Control>
              <input aria-describedby="external-description" />
            </FormField.Control>
            <FormField.HelperText>全角で入力してください</FormField.HelperText>
          </FormField>
          <p id="external-description">外部の説明</p>
        </>
      );

      expect(screen.getByLabelText('名前')).toHaveAccessibleDescription(
        '外部の説明 全角で入力してください'
      );
    });

    it('説明テキストが無いとき aria-describedby を付与しない', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByLabelText('名前')).not.toHaveAttribute('aria-describedby');
    });

    it('説明テキストが外れると aria-describedby も外れる', () => {
      const { rerender } = render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
          <FormField.HelperText>全角で入力してください</FormField.HelperText>
        </FormField>
      );

      expect(screen.getByLabelText('名前')).toHaveAttribute('aria-describedby');

      rerender(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByLabelText('名前')).not.toHaveAttribute('aria-describedby');
    });
  });

  describe('required の伝播', () => {
    it('required のとき aria-required を伝播する', () => {
      render(
        <FormField required>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'true');
    });

    it('required でないとき aria-required を付与しない', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-required');
    });

    it('入力要素側の aria-required を優先する', () => {
      render(
        <FormField required>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input aria-required={false} />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-required', 'false');
    });
  });

  describe('disabled の伝播', () => {
    it('disabled のとき data-disabled が付与される', () => {
      render(
        <FormField disabled>
          <FormField.Label>ラベル</FormField.Label>
        </FormField>
      );

      expect(screen.getByText('ラベル').closest('[data-disabled]')).toHaveAttribute(
        'data-disabled',
        'true'
      );
    });

    it('disabled を入力要素へ伝播する', () => {
      render(
        <FormField disabled>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('入力コンポーネントにも disabled を伝播する', () => {
      render(
        <FormField disabled>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <Input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('textbox')).toBeDisabled();
    });

    it('注入されない複数要素でも context 経由で disabled が伝わる', () => {
      render(
        <FormField disabled>
          <FormField.Label>受け取る通知</FormField.Label>
          <FormField.Control>
            <Checkbox>メール</Checkbox>
            <Checkbox>SMS</Checkbox>
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('checkbox', { name: 'メール' })).toBeDisabled();
      expect(screen.getByRole('checkbox', { name: 'SMS' })).toBeDisabled();
    });

    it('入力要素側で disabled を明示していればそちらを優先する', () => {
      render(
        <FormField disabled>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <Input disabled={false} />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('textbox')).toBeEnabled();
    });

    // data-disabled は Input など他コンポーネントも使う共有属性のため、
    // FormField の disabled が子コンポーネントの内部要素に漏れないことを担保する
    it('disabled でも子の Input のアドーンメントの色を変えない', () => {
      const { container } = render(
        <FormField disabled>
          <FormField.Label>ラベル</FormField.Label>
          <FormField.Control>
            <Input startIcon={<span>icon</span>} disabled={false} />
          </FormField.Control>
        </FormField>
      );
      const nested = container.querySelector('[data-position="start"]');

      const standalone = render(<Input startIcon={<span>icon</span>} aria-label="単体" />);
      const expected = standalone.container.querySelector('[data-position="start"]');

      expect(nested).not.toBeNull();
      expect(getComputedStyle(nested as Element).color).toBe(
        getComputedStyle(expected as Element).color
      );
    });
  });

  describe('エラー状態の伝播', () => {
    it('ErrorText を描画すると入力要素がエラー状態になる', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
          <FormField.ErrorText>必須項目です</FormField.ErrorText>
        </FormField>
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
    });

    it('ErrorText を描画しなければエラー状態にならない', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });

    it('ErrorText が外れるとエラー状態も解除される', () => {
      const { rerender } = render(
        <FormField>
          <FormField.Control>
            <input aria-label="名前" />
          </FormField.Control>
          <FormField.ErrorText>必須項目です</FormField.ErrorText>
        </FormField>
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');

      rerender(
        <FormField>
          <FormField.Control>
            <input aria-label="名前" />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });

    it('入力コンポーネントのエラー表示にも伝播する', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <Input />
          </FormField.Control>
          <FormField.ErrorText>必須項目です</FormField.ErrorText>
        </FormField>
      );

      expect(screen.getByRole('textbox').closest('[data-error]')).toHaveAttribute(
        'data-error',
        'true'
      );
    });

    it('ErrorText が無くても error を指定すればエラー状態になる', () => {
      render(
        <FormField error>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <Input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true');
      expect(screen.getByRole('textbox').closest('[data-error]')).toHaveAttribute(
        'data-error',
        'true'
      );
    });

    it('error={false} を指定すれば ErrorText を描画してもエラー状態にしない', () => {
      render(
        <FormField error={false}>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input />
          </FormField.Control>
          <FormField.ErrorText>必須項目です</FormField.ErrorText>
        </FormField>
      );

      expect(screen.getByRole('textbox')).not.toHaveAttribute('aria-invalid');
    });

    it('入力要素側の aria-invalid を優先する', () => {
      render(
        <FormField>
          <FormField.Label>名前</FormField.Label>
          <FormField.Control>
            <input aria-invalid={false} />
          </FormField.Control>
          <FormField.ErrorText>必須項目です</FormField.ErrorText>
        </FormField>
      );

      expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'false');
    });

    it('エラー状態を data 属性に反映する', () => {
      render(
        <FormField data-testid="field">
          <FormField.ErrorText>必須項目です</FormField.ErrorText>
        </FormField>
      );

      expect(screen.getByTestId('field')).toHaveAttribute('data-error', 'true');
    });
  });

  describe('パーツへの props', () => {
    it('Label にネイティブ属性と className を渡す', () => {
      render(
        <FormField>
          <FormField.Label className="custom" data-testid="label">
            ラベル
          </FormField.Label>
        </FormField>
      );

      expect(screen.getByTestId('label')).toHaveClass('custom');
    });

    it('Control にネイティブ属性と className を渡す', () => {
      render(
        <FormField>
          <FormField.Control className="custom" data-testid="control">
            <input />
          </FormField.Control>
        </FormField>
      );

      expect(screen.getByTestId('control')).toHaveClass('custom');
    });

    it('HelperText にネイティブ属性と className を渡す', () => {
      render(
        <FormField>
          <FormField.HelperText className="custom" data-testid="helper-text">
            補助テキスト
          </FormField.HelperText>
        </FormField>
      );

      expect(screen.getByTestId('helper-text')).toHaveClass('custom');
    });

    it('ErrorText にネイティブ属性と className を渡す', () => {
      render(
        <FormField>
          <FormField.ErrorText className="custom" data-testid="error-text">
            エラーメッセージ
          </FormField.ErrorText>
        </FormField>
      );

      expect(screen.getByTestId('error-text')).toHaveClass('custom');
    });
  });
});
