export interface ServerError {
  error?: string;
  errors?: MultipleServerError[];
  message?: string;
  path?: string;
  status?: number;
  timestamp?: Date;
}

export interface MultipleServerError {
  code?: string;
  codes?: string[];
  defaultMessage?: string;
  field?: string;
  objectName?: string;
  rejectedValue?: unknown;
  bindingFailure?: boolean;
  arguments?: readonly [MultipleServerError, number];
}

/**
 * The types of problems that the api can receive
 */
export enum ProblemKind {
  /**
   * The request was canceled.
   */
  'canceled' = 'canceled',
  /**
   * Times up.
   */
  'timeout' = 'timeout',
  /**
   * Cannot connect to the server for some reason.
   */
  'cannot-connect' = 'cannot-connect',
  /**
   * The server experienced a problem. Any 5xx error.
   */
  'server' = 'server',
  /**
   * We're not allowed because we haven't identified ourself. This is 401.
   */
  'unauthorized' = 'unauthorized',
  /**
   * We don't have access to perform that request. This is 403.
   */
  'forbidden' = 'forbidden',
  /**
   * Unable to find that resource.  This is a 404.
   */
  'not-found' = 'not-found',
  /**
   * All other 4xx series errors.
   */
  'rejected' = 'rejected',
  /**
   * Something truly unexpected happened. Most likely can try again. This is a catch all.
   */
  'unknown' = 'unknown',
  /**
   * The data we received is not in the expected format.
   */
  'bad-data' = 'bad-data',
  /**
   * There is a conflict preventing the requested action.
   */
  'conflict' = 'conflict',
  /**
   * If there was a partial success, but some parts of the request could not be processed.
   * - Server will return a warning message
   */
  'teapot' = 'teapot',
}

export interface GeneralApiProblem {
  kind: ProblemKind;
  temporary?: boolean;
  serverError?: ServerError;
}
