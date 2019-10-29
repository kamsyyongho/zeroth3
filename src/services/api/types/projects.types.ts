import { ModelConfig, Project, Threshold } from '../../../types';
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
export type getModelConfigsResult =
  | { kind: 'ok'; modelConfigs: ModelConfig[] }
  | GeneralApiProblem;
export type postModelConfigResult =
  | { kind: 'ok'; modelConfig: ModelConfig }
  | GeneralApiProblem;
export type deleteModelConfigResult = { kind: 'ok' } | GeneralApiProblem;
