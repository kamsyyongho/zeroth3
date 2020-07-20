import { DataSet, User, Shortcuts } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

/////////////
// RESULTS //
/////////////

export type resetPasswordResult = { kind: 'ok' } | GeneralApiProblem;

export type getProfile =
    | { kind: 'ok', user: User }
    | GeneralApiProblem;

export type getShortcuts =
    | { kind: 'ok', shortcuts: Shortcuts }
    | GeneralApiProblem;

export type updateShortcuts =
    | { kind: 'ok' }
    | GeneralApiProblem;

export type getDataSetsToFetchFromResult =
  | { kind: 'ok'; dataSets: DataSet[] }
  | GeneralApiProblem;

export type updatePhone =
    | { kind: 'ok', user: User }
    | GeneralApiProblem;
