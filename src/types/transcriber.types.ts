import { PaginatedResults } from '../services/api/types';
export interface Transcriber {
  id: string;
  email: string;
}

export interface TranscriberStats extends Transcriber {
  count: number;
  rating: number;
}

export interface TrascriberStatsResults extends PaginatedResults {
  content: TranscriberStats[];
}
