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

export interface PostModelConfigRequest {
  acousticModelId: number;
  languageModelId: number;
  name: string;
  description: string;
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
