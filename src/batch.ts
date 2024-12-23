import {
  Config,
  BatchObject,
  BatchesQuery,
  BatchesResults,
  BatchesResultsObject,
} from "./types";
import { HttpRequests } from "./http-requests";

class Batch {
  uid: BatchObject["uid"];
  details: BatchObject["details"];
  stats: BatchObject["stats"];
  startedAt: BatchObject["startedAt"];
  finishedAt: BatchObject["finishedAt"];
  duration: BatchObject["duration"];
  progress: BatchObject["progress"];

  constructor(batch: BatchObject) {
    this.uid = batch.uid;
    this.details = batch.details;
    this.stats = batch.stats;
    this.startedAt = batch.startedAt;
    this.finishedAt = batch.finishedAt;
    this.duration = batch.duration;
    this.progress = batch.progress;
  }
}

class BatchClient {
  httpRequest: HttpRequests;

  constructor(config: Config) {
    this.httpRequest = new HttpRequests(config);
  }

  /**
   * Get one batch
   *
   * @param uid - Unique identifier of the batch
   * @returns
   */
  async getBatch(uid: number): Promise<Batch> {
    const batch = (await this.httpRequest.get({
      relativeURL: `batches/${uid}`,
    })) as BatchObject;
    return new Batch(batch);
  }

  /**
   * Get batches
   *
   * @param parameters - Parameters to browse the batches
   * @returns Promise containing all batches
   */
  async getBatches(batchesQuery?: BatchesQuery): Promise<BatchesResults> {
    const batches = (await this.httpRequest.get({
      relativeURL: "batches",
      params: batchesQuery,
    })) as BatchesResultsObject;

    return {
      ...batches,
      results: batches.results.map((batch) => new Batch(batch)),
    };
  }
}

export { BatchClient, Batch };
