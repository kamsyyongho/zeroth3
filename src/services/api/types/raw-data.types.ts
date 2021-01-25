import { RawDataQueue, FullQueue } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

/////////////
// REQUEST //
/////////////

export interface PostDownloadLocationRequest {
  modelConfigId: string;
  path: string;
}

export interface PostDownloadLinkRequest {
  modelConfigId: string;
  url: string;
}

export interface ImportDataSets {
  modelConfigId: string;
  file: File;
}

/////////////
// RESULTS //
/////////////

export type getRawDataQueueResult =
  | { kind: 'ok'; queue: RawDataQueue }
  | GeneralApiProblem;
export type getFullQueue =
    | { kind: 'ok'; queue: FullQueue }
    | GeneralApiProblem;
export type uploadRawDataResult =
  | { kind: 'ok'; warningMessage?: string }
  | GeneralApiProblem;
export type postDownloadLocationResult = { kind: 'ok' } | GeneralApiProblem;
export type postDownloadLinkResult = { kind: 'ok' } | GeneralApiProblem;
export type importDataSetsResult = { kind: 'ok' } | GeneralApiProblem;
