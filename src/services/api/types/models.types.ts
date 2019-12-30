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

export type AcousticModelRequest = Omit<AcousticModel, 'id' | 'version'>;

export interface AcousticModelEditRequest {
  description: string;
}

export interface LanguageModelRequest {
  name: string;
  description: string;
  topGraphId: string;
  subGraphIds: string[];
}

export interface SubGraphRequest {
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

export type updateAcousticModelResult =
  | { kind: 'ok'; acousticModel: AcousticModel }
  | GeneralApiProblem;

export type deleteAcousticModelResult = { kind: 'ok' } | GeneralApiProblem;

export type getTopGraphsResult =
  | { kind: 'ok'; topGraphs: TopGraph[] }
  | GeneralApiProblem;

export type getLanguageModelsResult =
  | { kind: 'ok'; languageModels: LanguageModel[] }
  | GeneralApiProblem;

export type postLanguageModelResult =
  | { kind: 'ok'; languageModel: LanguageModel }
  | GeneralApiProblem;

export type updateLanguageModelResult =
  | { kind: 'ok'; languageModel: LanguageModel }
  | GeneralApiProblem;

export type deleteLanguageModelResult = { kind: 'ok' } | GeneralApiProblem;

export type getSubGraphsResult =
  | { kind: 'ok'; subGraphs: SubGraph[] }
  | GeneralApiProblem;

export type postSubGraphResult =
  | { kind: 'ok'; subGraph: SubGraph }
  | GeneralApiProblem;

export type updateSubGraphResult =
  | { kind: 'ok'; subGraph: SubGraph }
  | GeneralApiProblem;

export type deleteSubGraphResult = { kind: 'ok' } | GeneralApiProblem;
