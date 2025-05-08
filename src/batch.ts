import type { BatchView, AllBatches, TasksFilterQuery } from "./types/index.js";
import type { HttpRequests } from "./http-requests.js";

/**
 * Class for handling batches.
 *
 * @see {@link https://www.meilisearch.com/docs/reference/api/batches}
 */
export class BatchClient {
  readonly #httpRequest: HttpRequests;

  constructor(httpRequests: HttpRequests) {
    this.#httpRequest = httpRequests;
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/batches#get-one-batch} */
  async getBatch(uid: number): Promise<BatchView> {
    return await this.#httpRequest.get({ path: `batches/${uid}` });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/batches#get-batches} */
  async getBatches(params?: TasksFilterQuery): Promise<AllBatches> {
    return await this.#httpRequest.get({ path: "batches", params });
  }
}
