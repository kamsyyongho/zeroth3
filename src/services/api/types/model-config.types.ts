import { ModelConfig, Threshold } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export interface ModelConfigRequest {
  acousticModelId: string;
  languageModelId: string;
  name: string;
  thresholdHc: Threshold | null;
  thresholdLc: Threshold | null;
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
export type updateModelConfigResult =
  | { kind: 'ok'; modelConfig: ModelConfig }
  | GeneralApiProblem;
export type deleteModelConfigResult = { kind: 'ok' } | GeneralApiProblem;
