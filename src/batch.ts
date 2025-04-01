import type {
  Batch,
  BatchesResults,
  TasksOrBatchesQuery,
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
  async getBatch(uid: number): Promise<Batch> {
    const batch = await this.#httpRequest.get<Batch>({
      path: `batches/${uid}`,
    });
    return batch;
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/batches#get-batches} */
  async getBatches(
    batchesQuery?: TasksOrBatchesQuery,
  ): Promise<BatchesResults> {
    const batches = await this.#httpRequest.get<BatchesResults>({
      path: "batches",
      params: batchesQuery,
    });
    return batches;
  }
}
