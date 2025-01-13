import type {
  Batch,
  BatchesQuery,
  BatchesResults,
  BatchesResultsObject,
} from "./types/index.js";
import { HttpRequests, toQueryParams } from "./http-requests.js";

export class BatchClient {
  readonly #httpRequest: HttpRequests;

  constructor(httpRequests: HttpRequests) {
    this.#httpRequest = httpRequests;
  }

  /**
   * Get one batch
   *
   * @param uid - Unique identifier of the batch
   * @returns
   */
  async getBatch(uid: number): Promise<Batch> {
    const url = `batches/${uid}`;
    const batch = await this.#httpRequest.get<Batch>(url);
    return batch;
  }

  /**
   * Get batches
   *
   * @param parameters - Parameters to browse the batches
   * @returns Promise containing all batches
   */
  async getBatches(parameters: BatchesQuery = {}): Promise<BatchesResults> {
    const url = `batches`;

    const batches = await this.#httpRequest.get<Promise<BatchesResultsObject>>(
      url,
      toQueryParams<BatchesQuery>(parameters),
    );

    return batches;
  }
}
