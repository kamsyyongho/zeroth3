export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  note: string;
  roles: Role[];
}

export interface Role {
  id: string;
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
