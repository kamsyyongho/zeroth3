/**
 * the non-error codes that can be received from the server
 */
export enum ResponseCode {
  /**
   * There is no content to provide
   */
  'no-content' = 204,
}

/////////////
// RESULTS //
/////////////

export type refreshTokenResult = { kind: 'ok'; jwtRefreshed: boolean };
