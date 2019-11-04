/**
 * - `to` - used as the router path
 * - `title` - used as a key to get translations
 * - `function` - used to return a path string when providing the param values
 */
export interface Path {
  to?: string;
  title?: string;
  function?: (param: string | number) => string;
}

export const PATHS: { [x: string]: Path } = {
  home: {
    to: '/',
    title: 'home',
  },
  IAM: {
    to: '/iam',
    title: 'IAM',
  },
  projects: {
    to: '/projects',
    title: 'projects',
  },
  project: {
    to: '/projects/:projectId',
    function: (projectId: string | number) => `/projects/${projectId}`,
  },
  TDP: {
    to: '/projects/:projectId/tdp',
    function: (projectId: string | number) => `/projects/${projectId}/tdp`,
  },
  models: {
    to: '/models',
    title: 'models',
  },
};
