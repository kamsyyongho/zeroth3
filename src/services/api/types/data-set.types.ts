import { FilterParams } from '../../../types';
import { DataSet } from '../../../types/';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export interface PostDataSetRequest {
  name: string;
  filterParams: FilterParams;
}

export interface AssignTranscribersToDataSetRequest {
  transcribers: string[];
}

/////////////
// RESULTS //
/////////////

export type getAllResult =
  | { kind: 'ok'; dataSets: DataSet[] }
  | GeneralApiProblem;
export type postDataSetResult = { kind: 'ok' } | GeneralApiProblem;
export type assignTranscribersToDataSetResult = { kind: 'ok' } | GeneralApiProblem;
