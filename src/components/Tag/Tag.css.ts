import { interactiveTouch } from '@/styles/interactive';
import { truncate } from '@/styles/text';
import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

/** 閉じるボタン（＝閉じるアイコン）の見た目のサイズ */
export const CLOSE_BUTTON_SIZE = 14;
/** 閉じるボタンの最小タッチターゲットサイズ */
const CLOSE_BUTTON_TOUCH_SIZE = 24;

export const tag = style({
  display: 'inline-flex',
  // 親からはみ出さずに、あふれるぶんはラベル側で省略する
  maxWidth: '100%',
  alignItems: 'center',
  gap: vars.spacing.xs,
  padding: vars.spacing.xs,
  borderRadius: vars['border-radius'].sm,
  borderWidth: 1,
  borderStyle: 'solid',
  fontFamily: vars['font-family'].default,
  fontSize: vars['font-size'].xs,
  fontWeight: vars['font-weight'].normal,
  lineHeight: vars['line-height'].line,
});

// text-overflow は flex コンテナ自身には効かないため、ラベルを専用の要素に包んで省略する
export const tagLabel = style({
  ...truncate,
});

export const tagVariant = styleVariants({
  default: {
    borderColor: vars.color.grey[200],
    backgroundColor: vars.color.grey[50],
    color: vars.color.grey[700],
  },
  red: {
    borderColor: vars.color.red[200],
    backgroundColor: vars.color.red[50],
    color: vars.color.red[600],
  },
  blue: {
    borderColor: vars.color.blue[200],
    backgroundColor: vars.color.blue[0],
    color: vars.color.blue[700],
  },
  green: {
    borderColor: vars.color.green[200],
    backgroundColor: vars.color.green[0],
    color: vars.color.green[700],
  },
  yellow: {
    borderColor: vars.color.yellow[300],
    backgroundColor: vars.color.yellow[50],
    color: vars.color.yellow[800],
  },
  profile: {
    borderColor: vars.color.emerald[300],
    backgroundColor: vars.color.emerald[50],
    color: vars.color.emerald[700],
  },
  works: {
    borderColor: vars.color.teal[300],
    backgroundColor: vars.color.teal[50],
    color: vars.color.teal[700],
  },
  outputs: {
    borderColor: vars.color.sky[300],
    backgroundColor: vars.color.sky[50],
    color: vars.color.sky[700],
  },
});

export const tagCloseButton = style({
  // タッチ領域を広げる ::after の包含ブロックにする
  position: 'relative',
  // ラベルが長くても閉じるボタンは 14px を保つ
  flexShrink: 0,
  padding: vars.spacing.none,
  width: CLOSE_BUTTON_SIZE,
  height: CLOSE_BUTTON_SIZE,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  lineHeight: vars['line-height'].line,
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  ...interactiveTouch,

  // Tag のレイアウトを崩さないよう見た目は 14px のままにして、
  // タップ判定だけを 24px 四方（WCAG 2.2 Target Size (Minimum)）へ広げる
  '::after': {
    content: '""',
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: CLOSE_BUTTON_TOUCH_SIZE,
    height: CLOSE_BUTTON_TOUCH_SIZE,
    transform: 'translate(-50%, -50%)',
  },

  selectors: {
    // ネイティブのタップハイライトを消すぶん、フォーカス時の視覚フィードバックを Button / IconButton と揃える
    '&:focus-visible': {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing['2xs'],
    },
  },
});

export const tagCloseButtonVariant = styleVariants({
  default: {
    color: vars.color.grey[700],
    ':hover': {
      color: vars.color.grey[800],
    },
  },
  red: {
    color: vars.color.red[600],
    ':hover': {
      color: vars.color.red[700],
    },
  },
  blue: {
    color: vars.color.blue[700],
    ':hover': {
      color: vars.color.blue[800],
    },
  },
  green: {
    color: vars.color.green[700],
    ':hover': {
      color: vars.color.green[800],
    },
  },
  yellow: {
    color: vars.color.yellow[800],
    ':hover': {
      color: vars.color.yellow[850],
    },
  },
  profile: {
    color: vars.color.emerald[700],
    ':hover': {
      color: vars.color.emerald[800],
    },
  },
  works: {
    color: vars.color.teal[700],
    ':hover': {
      color: vars.color.teal[800],
    },
  },
  outputs: {
    color: vars.color.sky[700],
    ':hover': {
      color: vars.color.sky[800],
    },
  },
});
