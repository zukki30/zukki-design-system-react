/**
 * 配布物の型を、利用側と同じ書き方で使ってみる probe。
 *
 * `scripts/verify-dist.ts` から tsc に渡される。単体で実行するものではなく、
 * **型が通ること自体がテスト**であるため、実行時の副作用は持たない。
 *
 * ここに書くのは 2 種類。
 *
 * - 書けるべきもの … 型が狭すぎたり export が漏れたりすると落ちる
 * - 書けないべきもの … `@ts-expect-error` を付ける。エラーが出なくなると
 *   「未使用の @ts-expect-error」として逆に落ちるため、型が緩んだことを検知できる
 *
 * `scripts/` は tsconfig の include に入っていないため、`pnpm typecheck` の
 * 対象にはならない（dist が無い状態で落ちない）。
 */
import type { ReactNode } from 'react';

import {
  Button,
  Card,
  Checkbox,
  Dialog,
  FormField,
  Icon,
  IconButton,
  Input,
  Steps,
  Tag,
  iconNames,
  type ButtonProps,
  type ButtonSize,
  type ButtonVariant,
  type IconName,
  type InputProps,
  type SpinnerVariant,
  type TagVariant,
  type ZukkiVariantType,
} from '../../dist/main';

/* ------------------------------------------------------------------ *
 * 書けるべきもの
 * ------------------------------------------------------------------ */

// Props 型を使ってラッパーコンポーネントを書ける
const SubmitButton = (props: Omit<ButtonProps, 'type'>) => <Button {...props} type="submit" />;

// prop 単位で型を取り出せる
const EmailInput = ({ error, ...props }: InputProps) => <Input {...props} error={error} />;

// union が名前で参照できる
const BUTTON_VARIANTS: ButtonVariant[] = ['default', 'primary', 'failure', 'profile'];
const BUTTON_SIZES: ButtonSize[] = ['sm', 'md'];
const SPINNER_VARIANTS: SpinnerVariant[] = ['light', 'dark', 'primary', 'accent'];
const TAG_VARIANTS: TagVariant[] = ['default', 'red', 'works'];

// zukki サイト固有のバリアントを利用側の型に組み込める
type SectionTheme = { variant: ZukkiVariantType; label: string };
const SECTIONS: SectionTheme[] = [{ variant: 'profile', label: 'プロフィール' }];

// アイコン名を型でも値でも扱える
const renderIcon = (name: IconName) => <Icon name={name} width={16} height={16} />;
const ALL_ICONS = iconNames.map((name) => renderIcon(name));

// compound components を合成で組める
const CardExample = () => (
  <Card size="md">
    <Card.Header>
      <Card.Title level={3}>タイトル</Card.Title>
    </Card.Header>
    <Card.Body>本文</Card.Body>
    <Card.Footer>
      <Button variant="primary">保存</Button>
    </Card.Footer>
  </Card>
);

const DialogExample = ({ open, onClose }: { open: boolean; onClose: () => void }) => (
  <Dialog open={open} onClose={onClose}>
    <Dialog.Header>
      <Dialog.Title>確認</Dialog.Title>
      <Dialog.Close />
    </Dialog.Header>
    <Dialog.Body>削除しますか？</Dialog.Body>
    <Dialog.Footer>
      <Button variant="failure">削除</Button>
    </Dialog.Footer>
  </Dialog>
);

const FormFieldExample = () => (
  <FormField required error>
    <FormField.Label>メールアドレス</FormField.Label>
    <FormField.Control>
      <Input type="email" />
    </FormField.Control>
    <FormField.HelperText>会社のアドレスを入力してください</FormField.HelperText>
    <FormField.ErrorText>形式が正しくありません</FormField.ErrorText>
  </FormField>
);

const StepsExample = () => (
  <Steps current={2}>
    <Steps.Item>カート</Steps.Item>
    <Steps.Item>配送先</Steps.Item>
    <Steps.Item>確認</Steps.Item>
  </Steps>
);

// ラベルを持たないアイコンボタンは aria-label を渡せる
const CloseButton = () => (
  <IconButton aria-label="閉じる" variant="primary-exposed">
    {renderIcon('close')}
  </IconButton>
);

// children を持つ入力系
const AgreeCheckbox = ({ children }: { children: ReactNode }) => <Checkbox>{children}</Checkbox>;

const TagExample = () => <Tag label="React" variant="blue" onClose={() => {}} />;

/* ------------------------------------------------------------------ *
 * 書けないべきもの（型が緩むと「未使用の @ts-expect-error」で落ちる）
 * ------------------------------------------------------------------ */

// Issue #90 の失敗例その 1: danger は無い（正しくは failure）
// @ts-expect-error variant に danger は存在しない
const WrongVariant = () => <Button variant="danger">削除</Button>;

// Issue #90 の失敗例その 2: Button の size に lg は無い
// @ts-expect-error size に lg は存在しない
const WrongSize = () => <Button size="lg">送信</Button>;

// アイコンのみのボタンはアクセシブルネームを省略できない
// @ts-expect-error aria-label は必須
const MissingAriaLabel = () => <IconButton>{renderIcon('home')}</IconButton>;

// 存在しないアイコン名
// @ts-expect-error notExist は IconName に含まれない
const WrongIconName = () => <Icon name="notExist" width={16} height={16} />;

// compound components はスロット prop を持たない
// @ts-expect-error Dialog に title prop は無い。Dialog.Title を合成する
const SlotProp = () => <Dialog open title="確認" />;

// 見出しレベルは h2〜h6。h1 はページ全体の見出しなので持たない
// @ts-expect-error level に 1 は含まれない
const WrongHeadingLevel = () => <Card.Title level={1}>タイトル</Card.Title>;

// 内部専用のものは公開しない
// @ts-expect-error SizeType は汎用的すぎるため公開していない（ButtonSize を使う）
import type { SizeType } from '../../dist/main';

/* 未使用エラーを避けるためにまとめて参照する（実行はしない） */
export const PROBE = {
  SubmitButton,
  EmailInput,
  BUTTON_VARIANTS,
  BUTTON_SIZES,
  SPINNER_VARIANTS,
  TAG_VARIANTS,
  SECTIONS,
  ALL_ICONS,
  CardExample,
  DialogExample,
  FormFieldExample,
  StepsExample,
  CloseButton,
  AgreeCheckbox,
  TagExample,
  WrongVariant,
  WrongSize,
  MissingAriaLabel,
  WrongIconName,
  SlotProp,
  WrongHeadingLevel,
};
