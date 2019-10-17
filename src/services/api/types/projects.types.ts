import { Project } from '../../../types';
import { GeneralApiProblem } from '../api-problem';

export interface ProjectRequest {
  name: string;
  thresholdHc: number;
  thresholdLc: number;
}

/////////////
// RESULTS //
/////////////

export type getProjectResult =
  | { kind: 'ok'; projects: Project[] }
  | GeneralApiProblem;
export type postProjectResult =
  | { kind: 'ok'; project: Project }
  | GeneralApiProblem;
export type updateProjectResult =
  | { kind: 'ok'; project: Project }
  | GeneralApiProblem;
export type deleteProjectResult = { kind: 'ok' } | GeneralApiProblem;
