import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

const ICON_SIZE = '32px';

export const stepsItem = style({
  // stepsItemStatus（position: absolute）の包含ブロックを固定する
  position: 'relative',
  flexShrink: 0,
  display: 'grid',
  alignItems: 'center',
  justifyContent: 'flex-start',
  gridTemplateColumns: `${ICON_SIZE} auto`,
  gap: vars.spacing.sm,
  lineHeight: 1,

  selectors: {
    '&:is(button)': {
      padding: vars.spacing.none,
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
    },
  },
});

export const stepsItemIconBase = style({
  boxSizing: 'border-box',
  display: 'grid',
  placeItems: 'center',
  width: ICON_SIZE,
  height: ICON_SIZE,
  borderRadius: vars['border-radius'].full,
  borderWidth: 1,
  borderStyle: 'solid',
  fontFamily: vars['font-family'].number,
  fontSize: vars['font-size'].sm,
  fontStyle: 'normal',
  fontWeight: vars['font-weight'].normal,
  lineHeight: 1,
});

export const stepsItemIcon = styleVariants({
  default: [
    stepsItemIconBase,
    {
      borderColor: vars.color.grey[150],
      backgroundColor: vars.color.grey[150],
      color: vars.color.textOnLight.default,

      selectors: {
        [`${stepsItem}:is(button):hover &`]: {
          borderColor: vars.color.blue[400],
        },
      },
    },
  ],
  current: [
    stepsItemIconBase,
    {
      borderColor: vars.color.blue[500],
      backgroundColor: vars.color.blue[500],
      color: vars.color.textOnDark.default,

      selectors: {
        [`${stepsItem}:is(button):hover &`]: {
          borderColor: vars.color.blue[300],
          backgroundColor: vars.color.blue[300],
        },
      },
    },
  ],
  finished: [
    stepsItemIconBase,
    {
      borderColor: vars.color.blue[100],
      backgroundColor: vars.color.blue[100],
      color: vars.color.blue[500],
    },
  ],
});

/**
 * 視覚的には隠しつつ、支援技術には読み上げさせる状態テキスト
 */
export const stepsItemStatus = style({
  position: 'absolute',
  // 絶対配置でブロック化される挙動を明示する。アクセシブルネーム計算時に
  // ラベルとの間へ区切りが入り「カート 完了」のように読み上げられる
  display: 'block',
  width: 1,
  height: 1,
  padding: vars.spacing.none,
  margin: -1,
  overflow: 'hidden',
  clipPath: 'inset(50%)',
  whiteSpace: 'nowrap',
  borderWidth: 0,
});

export const stepsItemLabel = style({
  color: vars.color.textOnLight.default,
  fontFamily: vars['font-family'].default,
  fontSize: vars['font-size'].base,
  fontWeight: vars['font-weight'].normal,
  lineHeight: vars['line-height'].line,

  selectors: {
    [`${stepsItem}:is(button):hover &`]: {
      color: vars.color.blue[400],
    },
  },
});
