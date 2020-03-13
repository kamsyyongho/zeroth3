import { ROLES } from '../types';

export const PERMISSIONS = {
  profile: {
    renameOrganization: [ROLES.root],
  },
  IAM: {
    users: [ROLES.root, ROLES.admin],
    transcribers: [ROLES.root, ROLES.admin, ROLES.manager],
  },
  models: {
    acoustic: [ROLES.root, ROLES.manager],
    language: [ROLES.root, ROLES.manager],
    subGraph: [ROLES.root, ROLES.manager],
  },
  editor: {
    edit: [ROLES.transcriber],
    readOnly: [ROLES.root, ROLES.manager],
  },
  projects: {
    administration: [ROLES.root, ROLES.manager, ROLES.admin],
    SET: [ROLES.root, ROLES.manager],
    TDP: [ROLES.root, ROLES.manager],
  },
  modelConfig: [ROLES.root, ROLES.manager],
  modelTraining: [ROLES.root, ROLES.manager],
};
