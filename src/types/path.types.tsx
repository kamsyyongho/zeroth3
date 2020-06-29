/* eslint-disable react/display-name */
import { SvgIconProps } from '@material-ui/core';
import React from 'reactn';
import { ICONS } from '../theme/icons';
import SupervisorAccountIcon from '@material-ui/icons/SupervisorAccount';
import AssignmentIcon from '@material-ui/icons/Assignment';
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
  hasDivider?: boolean;
}

interface Paths {
  [x: string]: Path;
  home: Path;
  profile: Path;
  IAM: Path;
  project: Path;
  modelConfig: Path;
  models: Path;
  modelTraining: Path;
  editor: Path;
  admin: Path;
  transcribers: Path;
}

export const PATHS: { [x: string]: Path; } = {
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
  modelTraining: {
    to: '/training',
    title: 'modelTraining',
    Icon: props => <ICONS.Training {...props} />,
  },
  admin: {
    to: '/admin',
    title: 'admin',
    Icon: props => <SupervisorAccountIcon {...props} />,
  },
  transcription: {
    to: '/transcription',
    title: 'history',
    Icon: props => <AssignmentIcon {...props} />,
  },
  editor: {
    to: '/editor',
    title: 'editor',
    Icon: props => <ICONS.Editor {...props} />,
    hasDivider: true,
  },
};
