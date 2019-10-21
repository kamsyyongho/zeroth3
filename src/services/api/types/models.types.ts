import {
  AcousticModel,
  BaseModel,
  LanguageModel,
  Subgraph
} from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export type PostAcousticModelRequest = Omit<AcousticModel, 'id' | 'version'>;

export interface PostLanguageModelRequest {
  name: string;
  description: string;
  baseModelId: number;
  subGraphIds: number[];
}

export interface PostSubgraphRequest {
  name: string;
  public: boolean;
  text: string;
}

/////////////
// RESULTS //
/////////////

export type getAcousticModelsResult =
  | { kind: 'ok'; acousticModels: AcousticModel[] }
  | GeneralApiProblem;

export type postAcousticModelResult =
  | { kind: 'ok'; acousticModel: AcousticModel }
  | GeneralApiProblem;

export type getBaseModelsResult =
  | { kind: 'ok'; baseModels: BaseModel[] }
  | GeneralApiProblem;

export type getLanguageModelsResult =
  | { kind: 'ok'; languageModels: LanguageModel[] }
  | GeneralApiProblem;

export type postLanguageModelResult =
  | { kind: 'ok'; languageModel: LanguageModel }
  | GeneralApiProblem;

export type getSubgraphsResult =
  | { kind: 'ok'; subgraphs: Subgraph[] }
  | GeneralApiProblem;

export type postSubgraphResult =
  | { kind: 'ok'; subgraph: Subgraph }
  | GeneralApiProblem;
