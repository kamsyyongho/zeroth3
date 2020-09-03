import { Transcriber } from './transcriber.types';
import {CONTENT_STATUS, VoiceData} from './voice-data.types';

export interface DataSet {
  createdAt: Date;
  evaluationProgress?: number;
  evaluationUrl?: string;
  highRiskRatio: number;
  id: string;
  name: string;
  wordCount: number;
  /** the number of completed transcriptions */
  processed: number;
  total: number;
  rejected: number;
  transcribers: Transcriber[];
}

export interface FilterParams {
  from?: Date;
  till?: Date;
  filename?: string;
  /**
   * in seconds
   */
  'length-max'?: number;
  /**
   * in seconds
   * - from `0`
   */
  'length-min'?: number;
  dataSetIds?: string[];
  modelConfig?: string;
  status?: CONTENT_STATUS;
  transcript?: string;
  transcriber?: string[];
}

export interface PostDataSetFilterParams {
  from?: Date;
  till?: Date;
  filename?: string;
  
  lengthMax?: number;
  lengthMin?: number;
  dataSetIds?: string[];
  configId?: string;
  status?: CONTENT_STATUS;
  transcript?: string;
  transcriber?: string[];
}

export interface SubSet {
  content: VoiceData[];
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  numberOfElements: number;
  pageable: any;
  size: number;
  sort: any;
  totalElements: number;
  totalPages: number;
}
