export interface PagedResponse<T> {
  items: T[];
  totalRecords: number;

  pageNumber: number;
  pageSize: number;

  totalPages: number;

  hasPrevious: boolean;
  hasNext: boolean;
}
