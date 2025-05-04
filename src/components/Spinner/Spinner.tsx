import type { ComponentPropsWithoutRef } from 'react';

import { spinner } from './Spinner.css';

type Props = {
  variant?: 'light' | 'dark';
  /**
   * The aria-label attribute providing the accessible name of the icon.
   */
  'aria-label'?: string;
} & Omit<ComponentPropsWithoutRef<'svg'>, 'role' | 'name' | 'aria-label'>;

export const Spinner = ({ 'aria-label': ariaLabel, variant = 'light', ...restProps }: Props) => {
  return (
    <>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        role="img"
        className={spinner}
        data-variant={variant}
        aria-hidden={ariaLabel ? undefined : 'true'}
        {...restProps}
      >
        <title>{ariaLabel ?? 'Loading...'}</title>
        <path
          opacity="0.25"
          d="M12 1C18.0752 1 23 5.92487 23 12C23 18.0752 18.0752 23 12 23C5.92487 23 1 18.0752 1 12C1 5.92487 5.92487 1 12 1Z"
        />
        <path d="M12 1C18.0752 1 23 5.92487 23 12" />
      </svg>
    </>
  );
};
