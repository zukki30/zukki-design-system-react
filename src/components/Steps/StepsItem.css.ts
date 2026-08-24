import { truncate } from '@/styles/text';
import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

const ICON_SIZE = '32px';

const STEP_ITEM_BAR_MIN_SIZE = 2;

export const stepsItemContainer = style({
  display: 'flex',
  flex: 1,
  minWidth: 0,

  '::after': {
    backgroundColor: vars.color.grey[100],
    content: '',
  },

  selectors: {
    '&:last-child': {
      flex: 'none',
    },
    // 横並びの末尾のみ、伸ばさずに縮む余地だけ残す。
    // 縦並びで縮ませると高さが潰れる意味になってしまうためスコープを絞る
    '&[data-orientation="horizontal"]:last-child': {
      flex: '0 1 auto',
    },
    '&:last-child::after': {
      display: 'none',
    },
    '&[data-orientation="horizontal"]': {
      gap: vars.spacing.md,
      alignItems: 'center',
    },
    '&[data-orientation="horizontal"]::after': {
      flex: 1,
      height: STEP_ITEM_BAR_MIN_SIZE,
    },
    '&[data-orientation="vertical"]': {
      gap: vars.spacing.sm,
      flexDirection: 'column',
    },
    '&[data-orientation="vertical"]::after': {
      width: STEP_ITEM_BAR_MIN_SIZE,
      height: 20,
      marginInlineStart: `calc(${vars.spacing['xl']} - ${STEP_ITEM_BAR_MIN_SIZE}px)`,
    },
  },
});

export const stepsItem = style({
  // stepsItemStatus（position: absolute）の包含ブロックを固定する
  position: 'relative',
  // 長いラベルのときに親の幅まで縮められるようにする（縮んだぶんはラベル側で省略される）
  minWidth: 0,
  display: 'grid',
  alignItems: 'center',
  justifyContent: 'flex-start',
  // ラベル列は auto のままだと min-content 未満に縮まないため minmax(0, auto) にする
  gridTemplateColumns: `${ICON_SIZE} minmax(0, auto)`,
  gap: vars.spacing.sm,
  lineHeight: 1,

  selectors: {
    // 縦並びの主軸は縦なので、flex-shrink は「高さが縮む」意味になる。
    // 横幅のあふれ対策は不要なため、縮まない従来の挙動を保つ。
    // data-orientation は FormField など他コンポーネントも使うため、
    // 祖先セレクタは Steps のコンテナに限定する
    [`${stepsItemContainer}[data-orientation="vertical"] &`]: {
      flexShrink: 0,
    },
    '&:is(button)': {
      padding: vars.spacing.none,
      backgroundColor: 'transparent',
      border: 'none',
      cursor: 'pointer',
    },
    // フォーカス時の視覚フィードバックを Button / IconButton / Tag と揃える
    '&:is(button):focus-visible': {
      outline: `2px solid ${vars.color.focus}`,
      outlineOffset: vars.spacing['2xs'],
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

// 横並びはステップ同士が幅を奪い合うため 1 行で省略する
export const stepsItemLabel = style({
  ...truncate,
  color: vars.color.textOnLight.default,
  fontFamily: vars['font-family'].default,
  fontSize: vars['font-size'].base,
  fontWeight: vars['font-weight'].normal,
  lineHeight: vars['line-height'].line,

  selectors: {
    // 縦並びは 1 ステップが 1 行を占めて幅に余裕があるため、省略せず折り返して全文を見せる
    [`${stepsItemContainer}[data-orientation="vertical"] &`]: {
      whiteSpace: 'normal',
      overflowWrap: 'anywhere',
    },
    // 現在ステップを色以外でも示す（WCAG 1.4.1）。完了ステップはチェックアイコンという
    // 形状差があるが、現在ステップは default と円の形が同じで差が色だけになるため。
    // aria-current="step" を手がかりにするのは、Breadcrumb の現在ページと同じく
    // 「現在」の表し方を太字に揃えつつ、描画側と条件を二重に持たないため
    [`${stepsItem}[aria-current="step"] &`]: {
      fontWeight: vars['font-weight'].bold,
    },
    [`${stepsItem}:is(button):hover &`]: {
      color: vars.color.blue[400],
    },
  },
});
