import type { TaskStatus, TaskType } from "./task.js";
import type { CursorResults } from "./shared.js";

/**
 * Represents a batch operation object containing information about tasks
 * processing
 */
export type Batch = {
  /** Unique identifier for the batch */
  uid: number;

  /** Details about document processing */
  details: {
    /** Number of documents received in the batch */
    receivedDocuments?: number;
    /** Number of documents successfully indexed */
    indexedDocuments?: number;
    /** Number of documents deleted in the batch */
    deletedDocuments?: number;
  };

  /** Progress and indexing step of the batch, null if the batch is finished */
  progress: null | {
    /** An array of all the steps currently being processed */
    steps: Array<{
      /**
       * A string representing the name of the current step NOT stable. Only use
       * for debugging purposes.
       */
      currentStep: string;
      /** Number of finished tasks */
      finished: number;
      /** Total number of tasks to finish before moving to the next step */
      total: number;
    }>;
    /** Percentage of progression of all steps currently being processed */
    percentage: number;
  };

  /** Statistics about tasks within the batch */
  stats: {
    /** Total number of tasks in the batch */
    totalNbTasks: number;
    /** Count of tasks in each status */
    status: {
      /** Number of successfully completed tasks */
      succeeded: number;
      /** Number of failed tasks */
      failed: number;
      /** Number of canceled tasks */
      canceled: number;
      /** Number of tasks currently processing */
      processing: number;
      /** Number of tasks waiting to be processed */
      enqueued: number;
    };
    /** Count of tasks by type */
    types: Record<TaskType, number>;
    /** Count of tasks by index UID */
    indexUids: Record<string, number>;
  };

  /** Timestamp when the batch started processing (rfc3339 format) */
  startedAt: string;
  /** Timestamp when the batch finished processing (rfc3339 format) */
  finishedAt: string;
  /** Duration of batch processing */
  duration: string;
};

export type BatchesQuery = {
  /** The batch should contain the specified task UIDs */
  uids?: number[];
  batchUids?: number[];
  types?: TaskType[];
  statuses?: TaskStatus[];
  indexUids?: string[];
  canceledBy?: number[];
  beforeEnqueuedAt?: Date;
  afterEnqueuedAt?: Date;
  beforeStartedAt?: Date;
  afterStartedAt?: Date;
  beforeFinishedAt?: Date;
  afterFinishedAt?: Date;
  limit?: number;
  from?: number;
};

export type BatchesResults = CursorResults<Batch>;
export type BatchesResultsObject = CursorResults<Batch>;
