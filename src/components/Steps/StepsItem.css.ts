import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

const ICON_SIZE = '32px';

export const stepsItem = style({
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
