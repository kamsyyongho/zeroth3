/* eslint-disable react/display-name */
import { SvgIconProps } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import { FaRegEdit, FaUserShield } from 'react-icons/fa';
import { GiCube } from 'react-icons/gi';
import SvgIcon from '@material-ui/core/SvgIcon';
import React from 'react';
import { ICONS } from '../theme/icons';

/**
 * - `to` - used as the router path
 * - `title` - used as a key to get translations
 * - `Icon` - used to render the drawer icons
 * - `function` - used to return a path string when providing the param values
 */
export interface Path {
  to?: string;
  title?: string;
  Icon?: (props: SvgIconProps) => JSX.Element;
  function?: (param: string, ...restParams: string[]) => string;
}

export const PATHS: { [x: string]: Path } = {
  home: {
    to: '/',
    title: 'home',
    Icon: props => <ICONS.Home {...props} />,
  },
  profile: {
    to: '/profile',
  },
  IAM: {
    to: '/iam',
    title: 'IAM',
    Icon: props => <ICONS.IAM {...props} />,
  },
  project: {
    to: '/project/:projectId',
    function: (projectId: string) => `/project/${projectId}`,
  },
  modelConfig: {
    to: '/project/:projectId/model-config',
    function: (projectId: string) => `/project/${projectId}/model-config`,
  },
  models: {
    to: '/models',
    title: 'models',
    Icon: props => <ICONS.Models {...props} />,
  },
  editor: {
    to: '/editor',
    title: 'editor',
    Icon: props => <ICONS.Editor {...props} />,
  },
};
