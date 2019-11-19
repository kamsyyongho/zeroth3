import { GeneralApiProblem } from './api-problem.types';

/////////////
// RESULTS //
/////////////

export type resetPasswordResult = { kind: 'ok' } | GeneralApiProblem;
