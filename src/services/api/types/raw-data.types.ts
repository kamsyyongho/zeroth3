import { RawDataQueue } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

/////////////
// RESULTS //
/////////////

export type getRawDataQueueResult =
  | { kind: 'ok'; queue: RawDataQueue }
  | GeneralApiProblem;
export type uploadRawDataResult = { kind: 'ok' } | GeneralApiProblem;
