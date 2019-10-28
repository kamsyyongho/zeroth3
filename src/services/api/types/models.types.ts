import {
  AcousticModel,
  LanguageModel,
  SubGraph,
  TopGraph,
} from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export type PostAcousticModelRequest = Omit<AcousticModel, 'id' | 'version'>;

export interface PostLanguageModelRequest {
  name: string;
  description: string;
  topGraphId: number;
  subGraphIds: number[];
}

export interface PostSubGraphRequest {
  name: string;
  text: string;
  public?: boolean;
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

export type getTopGraphsResult =
  | { kind: 'ok'; topGraphs: TopGraph[] }
  | GeneralApiProblem;

export type getLanguageModelsResult =
  | { kind: 'ok'; languageModels: LanguageModel[] }
  | GeneralApiProblem;

export type postLanguageModelResult =
  | { kind: 'ok'; languageModel: LanguageModel }
  | GeneralApiProblem;

export type getSubGraphsResult =
  | { kind: 'ok'; subGraphs: SubGraph[] }
  | GeneralApiProblem;

export type postSubGraphResult =
  | { kind: 'ok'; subgraph: SubGraph }
  | GeneralApiProblem;
