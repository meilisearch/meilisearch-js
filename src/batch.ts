import {
  Config,
  BatchObject,
  BatchesQuery,
  BatchesResults,
  BatchesResultsObject,
} from "./types";
import { HttpRequests, toQueryParams } from "./http-requests";

class Batch {
  uid: BatchObject["uid"];
  details: BatchObject["details"];
  stats: BatchObject["stats"];
  startedAt: BatchObject["startedAt"];
  finishedAt: BatchObject["finishedAt"];
  duration: BatchObject["duration"];

  constructor(batch: BatchObject) {
    this.uid = batch.uid;
    this.details = batch.details;
    this.stats = batch.stats;
    this.startedAt = batch.startedAt;
    this.finishedAt = batch.finishedAt;
    this.duration = batch.duration;
  }
}

class BatchClient {
  httpRequest: HttpRequests;

  constructor(config: Config) {
    this.httpRequest = new HttpRequests(config);
  }

  /**
   * Get one task
   *
   * @param uid - Unique identifier of the task
   * @returns
   */
  async getBatch(uid: number): Promise<Batch> {
    const url = `batches/${uid}`;
    const batch = await this.httpRequest.get<BatchObject>(url);
    return new Batch(batch);
  }

  /**
   * Get tasks
   *
   * @param parameters - Parameters to browse the tasks
   * @returns Promise containing all tasks
   */
  async getBatches(parameters: BatchesQuery = {}): Promise<BatchesResults> {
    const url = `batches`;

    const tasks = await this.httpRequest.get<Promise<BatchesResultsObject>>(
      url,
      toQueryParams<BatchesQuery>(parameters),
    );

    return {
      ...tasks,
      results: tasks.results.map((task) => new Batch(task)),
    };
  }
}

export { BatchClient, Batch };
