import { Project, Threshold } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export interface ProjectRequest {
  name: string;
  thresholdHc: Threshold;
  thresholdLc: Threshold;
}

/////////////
// RESULTS //
/////////////

export type getProjectResult =
  | { kind: 'ok'; project: Project }
  | GeneralApiProblem;
export type getProjectsResult =
  | { kind: 'ok'; projects: Project[] }
  | GeneralApiProblem;
export type postProjectResult =
  | { kind: 'ok'; project: Project }
  | GeneralApiProblem;
export type deleteProjectResult = { kind: 'ok' } | GeneralApiProblem;
export type updateProjectResult =
  | { kind: 'ok'; project: Project }
  | GeneralApiProblem;
