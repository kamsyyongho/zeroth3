import { ApiResponse } from 'apisauce';
import { GeneralApiProblem, ProblemKind, ServerError } from './types';

/**
 * Attempts to get a common cause of problems from an api response.
 *
 * @param response The api response.
 */
export function getGeneralApiProblem(
  response: ApiResponse<ServerError>,
): GeneralApiProblem {
  let generalApiProblem: GeneralApiProblem = { kind: ProblemKind['unknown'] };
  switch (response.problem) {
    case 'CONNECTION_ERROR':
      generalApiProblem = {
        kind: ProblemKind['cannot-connect'],
        temporary: true,
      };
      break;
    case 'NETWORK_ERROR':
        generalApiProblem = {
          kind: ProblemKind['cannot-connect'],
          temporary: true,
        };
      break;
    case 'TIMEOUT_ERROR':
      generalApiProblem = { kind: ProblemKind['timeout'], temporary: true };
      break;
    case 'SERVER_ERROR':
      generalApiProblem = { kind: ProblemKind['server'] };
      break;
    case 'UNKNOWN_ERROR':
      generalApiProblem = { kind: ProblemKind['unknown'], temporary: true };
      break;
    case 'CLIENT_ERROR':
      switch (response.status) {
        case 401:
          generalApiProblem = { kind: ProblemKind['unauthorized'] };
          break;
        case 403:
          generalApiProblem = { kind: ProblemKind['forbidden'] };
          break;
        case 404:
          generalApiProblem = { kind: ProblemKind['not-found'] };
          break;
        case 409:
          generalApiProblem = { kind: ProblemKind['conflict'] };
          break;
        case 418: // I'm a teapot
          generalApiProblem = { kind: ProblemKind['teapot'] };
          break;
        default:
          generalApiProblem = { kind: ProblemKind['rejected'] };
          break;
      }
      break;
    case 'CANCEL_ERROR':
      generalApiProblem = { kind: ProblemKind['canceled'] };
      break;
  }

  if (generalApiProblem instanceof Object) {
    const serverError: ServerError | undefined = response.data;
    if (serverError) {
      generalApiProblem.serverError = serverError;
    } else {
      // append any axios error messages if no message from server
      const originalError = response.originalError?.toJSON() as
        | { stack: string; message: string }
        | undefined;
      if (originalError?.message) {
        generalApiProblem.serverError = {
          message: originalError.message,
        };
      }
    }
  }
  return generalApiProblem;
}
