import { GeneralApiProblem } from './api-problem.types';

export interface RawDataAdditionalProps {
  [x: string]: number;
}

/////////////
// RESULTS //
/////////////

export type getRawDataResult =
  | { kind: 'ok'; results: RawDataAdditionalProps }
  | GeneralApiProblem;
export type uploadRawDataResult = { kind: 'ok' } | GeneralApiProblem;
