export type Pagination = {
  offset?: number;
  limit?: number;
};

export type ResourceQuery = Pagination & {};

export type ResourceResults<T> = Pagination & {
  results: T;
  total: number;
};
