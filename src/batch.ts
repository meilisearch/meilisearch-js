import type {
  Batch,
  BatchesResults,
  ExtraRequestInit,
  TasksOrBatchesQuery,
} from "./types/index.js";
import type { HttpRequests } from "./http-requests.js";
import { readJsonEvents } from "./utils.js";

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
    return await this.#httpRequest.get({ path: `batches/${uid}` });
  }

  /** {@link https://www.meilisearch.com/docs/reference/api/batches#get-batches} */
  async getBatches(params?: TasksOrBatchesQuery): Promise<BatchesResults> {
    return await this.#httpRequest.get({ path: "batches", params });
  }

  /**
   * Stream every change of every batch, progress included, as it happens,
   * through the experimental `GET /batches/stream` route (Server-Sent Events).
   *
   * @remarks
   * Requires the `tasksStreamingRoute` experimental feature, see
   * {@link Meilisearch.updateExperimentalFeatures}. The returned promise
   * resolves once the connection is open: only the changes that happen after
   * that point are streamed. Leaving the loop, or calling `return()` on the
   * generator, closes the connection; an {@link AbortSignal} in
   * `extraRequestInit` closes it from the outside.
   */
  async streamBatches(
    extraRequestInit?: ExtraRequestInit,
  ): Promise<AsyncGenerator<Batch, void, undefined>> {
    const stream = await this.#httpRequest.getStream({
      path: "batches/stream",
      extraRequestInit,
    });

    return readJsonEvents<Batch>(stream);
  }
}
