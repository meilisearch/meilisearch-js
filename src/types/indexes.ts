/** @see `meilisearch::routes::indexes::ListIndexes` */
export type ListIndexes = {
  offset?: number;
  limit?: number;
};

/** @see `meilisearch::routes::PaginationView` */
type PaginationView<T> = {
  results: T[];
  offset: number;
  limit: number;
  total: number;
};

/** @see `meilisearch::routes::indexes::IndexView` */
export type IndexView = {
  uid: string;
  createdAt: string;
  updatedAt: string;
  primaryKey: string | null;
};

export type IndexViewList = PaginationView<IndexView>;
