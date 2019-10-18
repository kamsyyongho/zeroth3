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

export type renameOrganizationResult = { kind: 'ok' } | GeneralApiProblem;
