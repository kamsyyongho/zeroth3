import { Role, User } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export interface InviteUserRequest {
  email: string;
  transcriber?: boolean;
}

/////////////
// RESULTS //
/////////////

export type getUserResult = { kind: 'ok'; users: User[] } | GeneralApiProblem;
export type getRolesResult = { kind: 'ok'; roles: Role[] } | GeneralApiProblem;
export type deleteUserResult = { kind: 'ok' } | GeneralApiProblem;
export type assignRolesToUserResult =
  | { kind: 'ok'; user: User }
  | GeneralApiProblem;
export type deleteRoleResult = { kind: 'ok' } | GeneralApiProblem;
export type inviteUserResult = { kind: 'ok' } | GeneralApiProblem;
export type resetPasswordOfUserResult = { kind: 'ok' } | GeneralApiProblem;
