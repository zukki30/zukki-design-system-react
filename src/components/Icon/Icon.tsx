import type { ComponentPropsWithoutRef } from 'react';

import * as svgPaths from './svg';
import type { IconName } from './types';

type Props = {
  /**
   * Icon name.
   */
  name: IconName;
  /**
   * The aria-label attribute providing the accessible name of the icon.
   */
  'aria-label'?: string;
} & Omit<ComponentPropsWithoutRef<'svg'>, 'role' | 'name' | 'aria-label'>;

export const Icon = ({ name, 'aria-label': ariaLabel, ...restProps }: Props) => {
  const svgPath = svgPaths[name];

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="currentColor"
      role="img"
      aria-hidden={ariaLabel ? undefined : 'true'}
      {...restProps}
    >
      <title>{ariaLabel ?? name}</title>
      {svgPath()}
    </svg>
  );
};
