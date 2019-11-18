import {
  CONTENT_STATUS,
  Segment,
  VoiceData,
  WordAlignment,
} from '../../../types';
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
  from?: Date;
  till?: Date;
  /**
   * in seconds
   */
  'length-max'?: number;
  /**
   * in seconds
   * - from `0`
   */
  'length-min'?: number;
  'model-config'?: number;
  name?: string;
  /**
   * to `100`
   */
  'score-max'?: number;
  /**
   * from `0`
   */
  'score-min'?: number;
  /**
   * page size
   */
  size?: number;
  page?: number;
  status?: CONTENT_STATUS;
  transcript?: string;
}

export interface FetchUnconfirmedQuery {
  'model-config': number;
}

export interface SplitSegmentQuery {
  'split-index': number;
}

export interface MergeTwoSegmentsRequest {
  segmentIdA: number;
  segmentIdB: number;
}

export interface UpdateSegmentRequest {
  wordAlignments: WordAlignment[];
}

export type UpdateSegmentsRequest = Segment[];

/////////////
// RESULTS //
/////////////

export type confirmDataResult = { kind: 'ok' } | GeneralApiProblem;

export type searchDataResult =
  | { kind: 'ok'; data: VoiceDataResults }
  | GeneralApiProblem;

export type getAssignedDataResult =
  | { kind: 'ok'; data: VoiceDataResults }
  | GeneralApiProblem;

export type fetchUnconfirmedDataResult = { kind: 'ok' } | GeneralApiProblem;

export type getSegmentsDataResult =
  | { kind: 'ok'; segments: Segment[] }
  | GeneralApiProblem;

export type updateSegmentResult = { kind: 'ok' } | GeneralApiProblem;

export type updateSegmentsResult = { kind: 'ok' } | GeneralApiProblem;

export type splitSegmentResult = { kind: 'ok', segments: Segment[] } | GeneralApiProblem;

export type mergeTwoSegmentsResult =
  | { kind: 'ok'; segment: Segment }
  | GeneralApiProblem;
