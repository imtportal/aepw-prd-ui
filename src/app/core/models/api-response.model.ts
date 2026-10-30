export interface ApiResponse<T> {
  data:      T;
  message?:  string;
  status:    number;
  success?:  boolean;
  errors?:   string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total:    number;
  page:     number;
  pageSize: number;
}

/** Alias kept for forward compatibility with repository return types */
export type PagedResponse<T> = PaginatedResponse<T>;

export interface PagedRequest {
  page:      number;
  pageSize:  number;
  sortBy?:   string;
  sortDir?:  'asc' | 'desc';
  filters?:  Record<string, string>;
}
