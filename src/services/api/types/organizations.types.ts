import { Organization } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export interface RenameOrganizationRequest {
  name: string;
}

/////////////
// RESULTS //
/////////////

export type getOrganizationResult =
  | { kind: 'ok'; organization: Organization }
  | GeneralApiProblem;
export type renameOrganizationResult = { kind: 'ok' } | GeneralApiProblem;
