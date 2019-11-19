export interface User {
  id: number;
  email: string;
  roles: Role[];
}

export interface Role {
  id: number;
  name: ROLES;
}

/**
 * the valid roles that can be assigned to a user
 */
export enum ROLES {
  root = 'root',
  admin = 'admin',
  user = 'user',
  manager = 'manager',
  transcriber = 'transcriber',
}
