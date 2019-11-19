import { ROLES } from '../types';

interface Permissions {
  [x: string]: ROLES[];
}

export const PERMISSIONS: Permissions = {
  IAM: [ROLES.root, ROLES.admin],
  organization: [ROLES.root, ROLES.admin],
  models: [ROLES.root, ROLES.manager],
  modify: [ROLES.root, ROLES.manager],
};
