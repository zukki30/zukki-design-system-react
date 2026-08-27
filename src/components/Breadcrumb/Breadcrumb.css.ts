import { truncate } from '@/styles/text';
import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

export const breadcrumb = style({
  display: 'block',
});

export const breadcrumbList = style({
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'center',
  gap: vars.spacing.xs,
  margin: 0,
  padding: 0,
  listStyle: 'none',
});

export const breadcrumbItem = style({
  display: 'flex',
  alignItems: 'center',
  gap: vars.spacing.xs,
  // 長いラベルのときに行幅まで縮められるようにする（flexWrap で自身の行に落ちたあと省略される）
  minWidth: 0,
});

export const breadcrumbLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.spacing.xs,
  minWidth: 0,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].line,
  color: vars.color.textOnSurface.subtle,
  textDecoration: 'underline',

  selectors: {
    'a&:hover': {
      color: vars.color.textOnSurface.default,
    },
  },
});

const breadcrumbCurrentBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.spacing.xs,
  minWidth: 0,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].bold,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].line,
});

export const breadcrumbCurrent = styleVariants({
  default: [breadcrumbCurrentBase, { color: vars.color.textOnSurface.strong }],
  profile: [breadcrumbCurrentBase, { color: vars.color.profile.default }],
  works: [breadcrumbCurrentBase, { color: vars.color.works.default }],
  outputs: [breadcrumbCurrentBase, { color: vars.color.outputs.default }],
});

// アイコンは縮めず、あふれはラベル側で吸収する
export const breadcrumbIcon = style({
  display: 'inline-flex',
  flexShrink: 0,
});

// text-overflow は flex コンテナ自身には効かないため、ラベルを専用の要素に包んで省略する
export const breadcrumbLabel = style({
  ...truncate,
});

export const breadcrumbSeparator = style({
  display: 'block',
  flexShrink: 0,
  color: vars.color.textOnSurface.subtle,
});
