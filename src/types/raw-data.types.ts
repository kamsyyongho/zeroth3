import { PaginatedResults } from '../types/pagination.types';


export interface RawDataQueue {
  /** percentage */
  length: number;
}

interface Queue {
  fileName: string;
  modelName: string;
  status: string;
  length: number;
  remainingTime: number;
}

export interface FullQueue  extends PaginatedResults {
  content: Queue[];
}
