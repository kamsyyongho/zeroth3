/**
 * - `to` - used as the router path
 * - `title` - used as a key to get translations
 */
export interface Path {
  to?: string;
  title?: string;
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
  },
  models: {
    to: '/models',
    title: 'models',
  },
};
