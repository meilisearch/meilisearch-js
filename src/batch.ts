import type {
  Batch,
  BatchesResults,
  TasksOrBatchesQuery,
  ExtraRequestInit,
} from "./types/index.js";
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
  async getBatch(
    uid: number,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<Batch> {
    return await this.#httpRequest.get({
      path: `batches/${uid}`,
      extraRequestInit,
    });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/batches#get-batches} */
  async getBatches(
    params?: TasksOrBatchesQuery,
    extraRequestInit?: ExtraRequestInit,
  ): Promise<BatchesResults> {
    return await this.#httpRequest.get({
      path: "batches",
      params,
      extraRequestInit,
    });
  }
}
