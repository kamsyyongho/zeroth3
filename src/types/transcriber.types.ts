import { PaginatedResults } from './pagination.types';

export interface Transcriber {
  id: string;
  email: string;
}

export interface TranscriberStats extends Transcriber {
  count: number;
  rating: number;
  getTableProps: any;
  getTableBodyProps: any;
  headerGroups: any;
  prepareRow: any;
  page: any;
  canPreviousPage: any;
  canNextPage: any;
  pageOptions: any;
  pageCount: any;
  gotoPage: any;
  nextPage: any;
  previousPage: any;
  setPageSize: any;
  rows: any;
}

export interface TrascriberStatsResults extends PaginatedResults {
  content: TranscriberStats[];
}
