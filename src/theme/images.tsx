/* eslint-disable react/display-name */
import SvgIcon, { SvgIconProps } from '@material-ui/core/SvgIcon';
import React from "reactn";
import { ReactComponent as Logo } from './images/logo.svg';

// eslint-disable-next-line @typescript-eslint/interface-name-prefix
interface IMAGES {
  [x: string]: {
    svg?: (props: SvgIconProps) => JSX.Element;
    png?: {
      [x: string]: string;
    };
  };
}

/**
 * The custom PNG/SVG images for the site
 */
export const IMAGES = {
  /**
   * The main Zeroth logo
   */
  Logo: {
    svg: (props: SvgIconProps) => <SvgIcon viewBox="0 0 128 24" {...props}><Logo /></SvgIcon>,
    png: {
      ['1x']: require('./images/logo.png'),
      ['2x']: require('./images/logo@2x.png'),
      ['3x']: require('./images/logo@3x.png'),
    }
  },
};
