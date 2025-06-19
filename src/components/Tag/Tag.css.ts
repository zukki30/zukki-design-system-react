import { vars } from '@/styles/theme.css';
import { style, styleVariants } from '@vanilla-extract/css';

export const tagBase = style({
  display: 'inline-flex',
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

export const tagVariant = styleVariants({
  default: {
    borderColor: vars.color.grey[200],
    backgroundColor: vars.color.grey[50],
    color: vars.color.grey[700],
  },
  red: {
    borderColor: vars.color.red[200],
    backgroundColor: vars.color.red[50],
    color: vars.color.red[300],
  },
  blue: {
    borderColor: vars.color.blue[200],
    backgroundColor: vars.color.blue[0],
    color: vars.color.blue[500],
  },
  green: {
    borderColor: vars.color.green[200],
    backgroundColor: vars.color.green[0],
    color: vars.color.green[500],
  },
  yellow: {
    borderColor: vars.color.yellow[300],
    backgroundColor: vars.color.yellow[50],
    color: vars.color.yellow[600],
  },
  profle: {
    borderColor: vars.color.emerald[300],
    backgroundColor: vars.color.emerald[50],
    color: vars.color.emerald[600],
  },
  works: {
    borderColor: vars.color.teal[300],
    backgroundColor: vars.color.teal[50],
    color: vars.color.teal[600],
  },
  outputs: {
    borderColor: vars.color.sky[300],
    backgroundColor: vars.color.sky[50],
    color: vars.color.sky[600],
  },
});
