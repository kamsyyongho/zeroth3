import SvgIcon, { SvgIconProps } from '@material-ui/core/SvgIcon';
import React from 'react';
import { IconType } from 'react-icons';


interface IconWrapperProps extends SvgIconProps {
  children: IconType | React.ReactNode;
}
/**
 * Wraps svg icons from `react-icons` in a `SvgIcon` component from `material-ui`
 * @param props the props that `material-ui` provides for their icons
 */
export const SvgIconWrapper = (props: IconWrapperProps) => {
  const { children } = props;
  return (
    <SvgIcon {...props}>
      {typeof children === 'function' ? children({}) : children}
    </SvgIcon>
  );
};
