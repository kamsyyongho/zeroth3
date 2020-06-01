import { DataSet, User } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

/////////////
// RESULTS //
/////////////

export type resetPasswordResult = { kind: 'ok' } | GeneralApiProblem;

export type getProfile = 
    | { kind: 'ok', user: User }
    | GeneralApiProblem;

export type getDataSetsToFetchFromResult =
  | { kind: 'ok'; dataSets: DataSet[] }
  | GeneralApiProblem;
