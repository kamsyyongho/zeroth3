import { ModelConfig } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export interface PostModelConfigRequest {
  acousticModelId: number;
  languageModelId: number;
  name: string;
  description: string;
}

/////////////
// RESULTS //
/////////////

export type getModelConfigsResult =
  | { kind: 'ok'; modelConfigs: ModelConfig[] }
  | GeneralApiProblem;
export type postModelConfigResult =
  | { kind: 'ok'; modelConfig: ModelConfig }
  | GeneralApiProblem;
export type deleteModelConfigResult = { kind: 'ok' } | GeneralApiProblem;
