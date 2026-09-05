// design tokens
import './design-tokens/dark';
import './design-tokens/light';
import './design-tokens/light-dark';
import './design-tokens/token';
import './design-tokens/typography';

// styles
// 配色を固定した CSS は dist で派生生成するため、ここでは両対応版だけを読む。
// 3 ファイルは同じ変数を同じ :root に定義しており、まとめて読むと後勝ちで
// variables.css だけが効き、前の 2 つは到達しない宣言として残るだけになる
import './styles/variables.css';

// 複数コンポーネントで共有する型
export type { HeadingLevel } from './types';

// components
export { Icon } from './components/Icon';
export { Button } from './components/Button';
export { Spinner } from './components/Spinner';
export { IconButton } from './components/IconButton';
export { Skeleton } from './components/Skeleton';
export type { SkeletonShape } from './components/Skeleton';
export { Steps, useStepsContext, useStepsItemNumber } from './components/Steps';
export type {
  StepsContextValue,
  StepsItemProps,
  StepsOrientation,
  StepsProps,
} from './components/Steps';
export { Input } from './components/Input';
export { InputNumber } from './components/InputNumber';
export { TextArea } from './components/TextArea';
export { Checkbox } from './components/Checkbox';
export { Radio } from './components/Radio';
export { Switch } from './components/Switch';
export { Select } from './components/Select';
export { FormField, useFormFieldContext, useFormFieldState } from './components/FormField';
export type {
  FormFieldContextValue,
  FormFieldControlProps,
  FormFieldControlState,
  FormFieldErrorTextProps,
  FormFieldHelperTextProps,
  FormFieldLabelProps,
  FormFieldOrientation,
  FormFieldProps,
  FormFieldRequiredMark,
} from './components/FormField';
export { Card, useCardContext } from './components/Card';
export type {
  CardActionProps,
  CardBodyProps,
  CardContextValue,
  CardFooterProps,
  CardHeaderProps,
  CardImageProps,
  CardProps,
  CardSize,
  CardTitleProps,
} from './components/Card';
export { Dialog, useDialogContext } from './components/Dialog';
export type {
  DialogBodyProps,
  DialogCloseProps,
  DialogContextValue,
  DialogFooterProps,
  DialogHeaderProps,
  DialogProps,
  DialogTitleProps,
} from './components/Dialog';
export { Breadcrumb } from './components/Breadcrumb';
export type { BreadcrumbItem, BreadcrumbVariant } from './components/Breadcrumb';
export { Tooltip } from './components/Tooltip';
export type { TooltipPlacement } from './components/Tooltip';
export { Tag } from './components/Tag';
export type { TagVariant } from './components/Tag';
