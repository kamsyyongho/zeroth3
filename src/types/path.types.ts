import { SvgIconProps } from '@material-ui/core';
import HomeIcon from '@material-ui/icons/Home';
import { FaProjectDiagram, FaUsers, FaUserShield } from 'react-icons/fa';
import { GiCube } from 'react-icons/gi';
import { SvgIconWrapper } from '../routes/shared/SvgIconWrapper';

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
  function?: (
    param: string | number,
    ...restParams: (string | number)[]
  ) => string;
}

export const PATHS: { [x: string]: Path } = {
  home: {
    to: '/',
    title: 'home',
    Icon: HomeIcon,
  },
  profile: {
    to: '/profile',
  },
  IAM: {
    to: '/iam',
    title: 'IAM',
    Icon: props => SvgIconWrapper({ ...props, children: FaUserShield }),
  },
  transcribers: {
    to: '/transcribers',
    title: 'transcribers',
    Icon: props => SvgIconWrapper({ ...props, children: FaUsers }),
  },
  projects: {
    to: '/projects',
    title: 'projects',
    Icon: props => SvgIconWrapper({ ...props, children: FaProjectDiagram }),
  },
  project: {
    to: '/projects/:projectId',
    function: (projectId: string | number) => `/projects/${projectId}`,
  },
  TDP: {
    to: '/projects/:projectId/tdp',
    function: (projectId: string | number) => `/projects/${projectId}/tdp`,
  },
  editor: {
    to: '/projects/:projectId/tdp/:dataId/editor',
    function: (projectId: string | number, dataId: string | number) =>
      `/projects/${projectId}/tdp/${dataId}/editor`,
  },
  models: {
    to: '/models',
    title: 'models',
    Icon: props => SvgIconWrapper({ ...props, children: GiCube }),
  },
};
