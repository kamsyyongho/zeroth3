import { GeneralApiProblem } from '../api-problem';

/////////////
// RESULTS //
/////////////

export type refreshTokenResult = { kind: 'ok'; jwtRefreshed: boolean };
export type getScheduleListResult =
  | { kind: 'ok'; schedules: any }
  | GeneralApiProblem;
