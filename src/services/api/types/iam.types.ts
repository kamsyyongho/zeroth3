import { User } from '../../../types/users.types';
import { GeneralApiProblem } from '../api-problem';

/////////////
// RESULTS //
/////////////

export type getUserResult = { kind: 'ok'; users: User[] } | GeneralApiProblem;
export type deleteUserResult = { kind: 'ok' } | GeneralApiProblem;
export type assignRolesResult =
  | { kind: 'ok'; users: User[] }
  | GeneralApiProblem;
export type deleteRoleResult = { kind: 'ok' } | GeneralApiProblem;
export type inviteUserResult = { kind: 'ok' } | GeneralApiProblem;
