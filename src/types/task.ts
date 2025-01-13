import type { Settings } from "./settings.js";
import type { CursorResults } from "./shared.js";
import type { MeiliSearchErrorResponse } from "./types.js";

export type EnqueuedTaskPromise = Promise<EnqueuedTask> & {
  waitTask: (waitOptions?: WaitOptions) => Promise<Task>;
};

export type TaskStatus =
  | "enqueued"
  | "processing"
  | "succeeded"
  | "failed"
  | "canceled";

export type TaskType =
  | "documentAdditionOrUpdate"
  | "documentEdition"
  | "documentDeletion"
  | "settingsUpdate"
  | "indexCreation"
  | "indexDeletion"
  | "indexUpdate"
  | "indexSwap"
  | "taskCancelation"
  | "taskDeletion"
  | "dumpCreation"
  | "snapshotCreation";

export type TasksQuery = {
  indexUids?: string[];
  uids?: number[];
  types?: TaskType[];
  statuses?: TaskStatus[];
  canceledBy?: number[];
  beforeEnqueuedAt?: Date;
  afterEnqueuedAt?: Date;
  beforeStartedAt?: Date;
  afterStartedAt?: Date;
  beforeFinishedAt?: Date;
  afterFinishedAt?: Date;
  limit?: number;
  from?: number;
  /**
   * If true, the tasks are returned in reverse order (requires Meilisearch
   * 1.12.0 or later)
   */
  reverse?: boolean;
};

export type CancelTasksQuery = Omit<TasksQuery, "limit" | "from">;

export type DeleteTasksQuery = Omit<TasksQuery, "limit" | "from">;

// https://www.meilisearch.com/docs/reference/api/tasks#summarized-task-object
export type EnqueuedTask = {
  taskUid: number;
  indexUid: string | null;
  status: TaskStatus;
  type: TaskType;
  enqueuedAt: string;
};

export type TaskDetails = Settings & {
  receivedDocuments?: number;
  indexedDocuments?: number;
  editedDocuments?: number;
  primaryKey?: string;
  providedIds?: number;
  deletedDocuments?: number;
  matchedTasks?: number;
  canceledTasks?: number;
  deletedTasks?: number;
  originalFilter?: string | null;
  dumpUid?: string | null;
  context?: Record<string, unknown> | null;
  function?: string;
  swaps?: SwapIndexesParams;
};

// https://www.meilisearch.com/docs/reference/api/tasks#task-object
export type Task = Omit<EnqueuedTask, "taskUid"> & {
  uid: number;
  batchUid: number | null;
  canceledBy: number | null;
  details?: TaskDetails;
  error: MeiliSearchErrorResponse | null;
  duration: string;
  startedAt: string;
  finishedAt: string;
};

export type SwapIndexesParams = Array<{
  indexes: string[];
}>;

export type TasksResults = CursorResults<Task>;
export type TasksResultsObject = CursorResults<Task>;

export type WaitOptions = {
  timeOutMs?: number;
  intervalMs?: number;
};
