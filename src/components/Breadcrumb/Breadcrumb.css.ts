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
});

export const breadcrumbLink = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.spacing.xs,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].normal,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].line,
  color: vars.color.grey['500'],
  textDecoration: 'underline',

  selectors: {
    'a&:hover': {
      color: vars.color.grey['700'],
    },
  },
});

const breadcrumbCurrentBase = style({
  display: 'inline-flex',
  alignItems: 'center',
  gap: vars.spacing.xs,
  fontFamily: vars['font-family'].default,
  fontWeight: vars['font-weight'].bold,
  fontSize: vars['font-size'].sm,
  lineHeight: vars['line-height'].line,
});

export const breadcrumbCurrent = styleVariants({
  default: [breadcrumbCurrentBase, { color: vars.color.grey['1000'] }],
  profile: [breadcrumbCurrentBase, { color: vars.color.profile.default }],
  works: [breadcrumbCurrentBase, { color: vars.color.works.default }],
  outputs: [breadcrumbCurrentBase, { color: vars.color.outputs.default }],
});

export const breadcrumbSeparator = style({
  display: 'block',
  flexShrink: 0,
  color: vars.color.grey['500'],
});
