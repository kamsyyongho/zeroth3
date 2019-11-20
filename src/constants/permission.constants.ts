import { ROLES } from '../types';

export const PERMISSIONS = {
  IAM: [ROLES.root, ROLES.admin],
  organization: [ROLES.root, ROLES.admin],
  models: [ROLES.root, ROLES.manager],
  crud: [ROLES.root, ROLES.manager],
};
