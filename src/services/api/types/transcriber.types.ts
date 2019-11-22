import { Transcriber, TrascriberStatsResults } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

//////////////
// REQUESTS //
//////////////

export interface TranscribersWithStatsRequest {
  page: number;
  size: number;
}

/////////////
// RESULTS //
/////////////

export type getTranscribersResult =
  | { kind: 'ok'; transcribers: Transcriber[] }
  | GeneralApiProblem;

export type getTranscribersWithStatsResults =
  | { kind: 'ok'; data: TrascriberStatsResults }
  | GeneralApiProblem;
