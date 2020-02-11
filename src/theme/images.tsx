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
    jpg?: {
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
    },
  },
  /**
   * The tutorial images
   */
  HomePage: {
    /** an image of the site's drawer */
    drawer: {
      jpg: {
        ['1x']: require('./images/home-1.jpg'),
        ['2x']: require('./images/home-1@2x.jpg'),
        ['3x']: require('./images/home-1@3x.jpg'),
      }
    },
    /** an image of the site's header */
    header: {
      jpg: {
        ['1x']: require('./images/home-2.jpg'),
        ['2x']: require('./images/home-2@2x.jpg'),
        ['3x']: require('./images/home-2@3x.jpg'),
      }
    },
  },
};
