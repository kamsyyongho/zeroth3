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

export interface Data {
  resultType: string;
  result: Result[];
}

export interface Metric{
  __name__: string;
  application: string;
  instance: string;
  job: string;
  ip: string;
}

export interface Result {
  metric: string;
  values: [];
}
export interface Grap {
    status: string;
    data: Data;
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
