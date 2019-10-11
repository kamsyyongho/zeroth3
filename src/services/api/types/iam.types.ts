import { GeneralApiProblem } from '../api-problem';

export interface User {
  id: string;
  email: string;
  roles: Role[];
}

export interface Role {
  id: number;
  name: string;
}

/////////////
// RESULTS //
/////////////

export type getUserResult = { kind: 'ok'; users: User[] } | GeneralApiProblem;
