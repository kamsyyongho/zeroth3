import { CONTENT_STATUS, VoiceData } from '../../../types';
import { GeneralApiProblem } from './api-problem.types';

interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

interface Pageable {
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
  sort: Sort;
}

export interface VoiceDataResults {
  content: VoiceData[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: Pageable;
  size: number;
  sort: Sort;
  totalElements: number;
  totalPages: number;
}

//////////////
// REQUESTS //
//////////////

export interface SearchDataRequest {
  from?: string;
  'length-max'?: number;
  'length-min'?: number;
  'model-config'?: number;
  name?: string;
  page?: number;
  'score-max'?: number;
  'score-min'?: number;
  size?: number;
  status?: CONTENT_STATUS;
  till?: Date;
  transcript?: string;
}

/////////////
// RESULTS //
/////////////

export type searchDataResult =
  | { kind: 'ok'; data: VoiceDataResults }
  | GeneralApiProblem;
