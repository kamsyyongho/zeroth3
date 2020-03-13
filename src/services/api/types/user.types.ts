import { DataSet } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

/////////////
// RESULTS //
/////////////

export type resetPasswordResult = { kind: 'ok' } | GeneralApiProblem;

export type getDataSetsToFetchFromResult =
  | { kind: 'ok'; dataSets: DataSet[] }
  | GeneralApiProblem;
