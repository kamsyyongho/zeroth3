import { RawDataQueue, FullQueue } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

/////////////
// REQUEST //
/////////////

export interface PostDownloadLocationRequest {
  modelConfigName: string;
  path: string;
}

export interface PostDownloadLinkRequest {
  modelConfigName: string;
  url: string;
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
