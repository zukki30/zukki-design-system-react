export const iconNames = [
  'baselineMinus',
  'calendarMonth',
  'checkboxMarkedCircle',
  'chevronDown',
  'chevronLeft',
  'chevronRight',
  'chevronUp',
  'close',
  'closeCircle',
  'eye',
  'eyeOff',
  'github',
  'home',
  'menuDown',
  'menuUp',
  'outlineCheck',
  'windowRestore',
] as const;

export type IconName = (typeof iconNames)[number];
