import { vars } from '@/styles/theme.css';
import { style } from '@vanilla-extract/css';

const elevation2 = vars.Elevation.Styles.elevation2;
const gap = vars.spacing.sm; // 吹き出しとターゲットの間隔（＝矢印の突き出し量）
const edgeOffset = vars.spacing.md; // 端寄せ配置での矢印オフセット

export const tooltip = style({
  display: 'inline-flex',
});

export const tooltipPopup = style({
  // Popover API により top layer へ表示される。位置は CSS Anchor Positioning で
  // ターゲット（tooltip）に対して決定する。
  position: 'fixed',
  // ブラウザ既定の popover UA スタイルを打ち消す
  inset: 'auto', // 既定の `inset: 0` を打ち消し、配置ごとに必要な辺のみ指定する
  margin: 0,
  border: 'none', // 既定の `border: solid` を消す
  overflow: 'visible', // 既定の `overflow: auto` による矢印のクリップを防ぐ
  zIndex: 10,
  boxSizing: 'border-box',
  width: 'max-content',
  maxWidth: 240,
  padding: vars.spacing.sm,
  borderRadius: vars['border-radius'].sm,
  backgroundColor: vars.color.surface.inverse,
  color: vars.color.textOnInverse.default,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].default,
  boxShadow: `${elevation2.x} ${elevation2.y} ${elevation2.blur}px ${elevation2.spread} ${elevation2.color}`,

  selectors: {
    // 配置（anchor() でターゲットの各辺を参照する）
    '&[data-placement="top"]': {
      bottom: 'anchor(top)',
      left: 'anchor(center)',
      transform: 'translateX(-50%)',
      marginBottom: gap,
    },
    '&[data-placement="topLeft"]': {
      bottom: 'anchor(top)',
      left: 'anchor(left)',
      marginBottom: gap,
    },
    '&[data-placement="topRight"]': {
      bottom: 'anchor(top)',
      right: 'anchor(right)',
      marginBottom: gap,
    },
    '&[data-placement="bottom"]': {
      top: 'anchor(bottom)',
      left: 'anchor(center)',
      transform: 'translateX(-50%)',
      marginTop: gap,
    },
    '&[data-placement="bottomLeft"]': {
      top: 'anchor(bottom)',
      left: 'anchor(left)',
      marginTop: gap,
    },
    '&[data-placement="bottomRight"]': {
      top: 'anchor(bottom)',
      right: 'anchor(right)',
      marginTop: gap,
    },
    '&[data-placement="left"]': {
      right: 'anchor(left)',
      top: 'anchor(center)',
      transform: 'translateY(-50%)',
      marginRight: gap,
    },
    '&[data-placement="right"]': {
      left: 'anchor(right)',
      top: 'anchor(center)',
      transform: 'translateY(-50%)',
      marginLeft: gap,
    },
  },
});

export const tooltipArrow = style({
  position: 'absolute',
  width: 0,
  height: 0,
  borderStyle: 'solid',
  borderColor: 'transparent',

  selectors: {
    // 上方向（下向き矢印）
    [`${tooltipPopup}[data-placement="top"] &`]: {
      bottom: `calc(${gap} * -1)`,
      left: '50%',
      transform: 'translateX(-50%)',
      borderWidth: '8px 6px 0 6px',
      borderTopColor: vars.color.surface.inverse,
    },
    [`${tooltipPopup}[data-placement="topLeft"] &`]: {
      bottom: `calc(${gap} * -1)`,
      left: edgeOffset,
      borderWidth: '8px 6px 0 6px',
      borderTopColor: vars.color.surface.inverse,
    },
    [`${tooltipPopup}[data-placement="topRight"] &`]: {
      bottom: `calc(${gap} * -1)`,
      right: edgeOffset,
      borderWidth: '8px 6px 0 6px',
      borderTopColor: vars.color.surface.inverse,
    },
    // 下方向（上向き矢印）
    [`${tooltipPopup}[data-placement="bottom"] &`]: {
      top: `calc(${gap} * -1)`,
      left: '50%',
      transform: 'translateX(-50%)',
      borderWidth: '0 6px 8px 6px',
      borderBottomColor: vars.color.surface.inverse,
    },
    [`${tooltipPopup}[data-placement="bottomLeft"] &`]: {
      top: `calc(${gap} * -1)`,
      left: edgeOffset,
      borderWidth: '0 6px 8px 6px',
      borderBottomColor: vars.color.surface.inverse,
    },
    [`${tooltipPopup}[data-placement="bottomRight"] &`]: {
      top: `calc(${gap} * -1)`,
      right: edgeOffset,
      borderWidth: '0 6px 8px 6px',
      borderBottomColor: vars.color.surface.inverse,
    },
    // 左方向（右向き矢印）
    [`${tooltipPopup}[data-placement="left"] &`]: {
      right: `calc(${gap} * -1)`,
      top: '50%',
      transform: 'translateY(-50%)',
      borderWidth: '6px 0 6px 8px',
      borderLeftColor: vars.color.surface.inverse,
    },
    // 右方向（左向き矢印）
    [`${tooltipPopup}[data-placement="right"] &`]: {
      left: `calc(${gap} * -1)`,
      top: '50%',
      transform: 'translateY(-50%)',
      borderWidth: '6px 8px 6px 0',
      borderRightColor: vars.color.surface.inverse,
    },
  },
});
