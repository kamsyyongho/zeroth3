export enum ORDER {
  'asc' = 'asc',
  'desc' = 'desc',
}

export interface Sort {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface Pageable {
  offset: number;
  pageNumber: number;
  pageSize: number;
  paged: boolean;
  unpaged: boolean;
  sort: Sort;
}

export interface PaginatedResults {
  empty: boolean;
  first: boolean;
  last: boolean;
  number: number;
  /** per page */
  numberOfElements: number;
  pageable: Pageable;
  size: number;
  sort: Sort;
  /** total */
  totalElements: number;
  totalPages: number;
}
