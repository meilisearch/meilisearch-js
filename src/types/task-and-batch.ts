import type { RecordAny, Settings } from "./types.js";
import type {
  PascalToCamelCase,
  SafeOmit,
  OptionStarOr,
  OptionStarOrList,
} from "./shared.js";
import type { MeiliSearchErrorResponse } from "./types.js";

/** Options for awaiting an {@link EnqueuedTask}. */
export type WaitOptions = {
  /**
   * Milliseconds until timeout error will be thrown for each awaited task. A
   * value of less than `1` disables it.
   *
   * @defaultValue `5000`
   */
  timeout?: number;
  /**
   * Task polling interval in milliseconds. A value of less than `1` disables
   * it.
   *
   * @defaultValue `50`
   */
  interval?: number;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#status}
 *
 * @see `meilisearch_types::tasks::Status`
 */
export type TaskStatus = PascalToCamelCase<
  "Enqueued" | "Processing" | "Succeeded" | "Failed" | "Canceled"
>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#type}
 *
 * @see `meilisearch_types::tasks::Kind`
 */
export type TaskType = PascalToCamelCase<
  | "DocumentAdditionOrUpdate"
  | "DocumentEdition"
  | "DocumentDeletion"
  | "SettingsUpdate"
  | "IndexCreation"
  | "IndexDeletion"
  | "IndexUpdate"
  | "IndexSwap"
  | "TaskCancelation"
  | "TaskDeletion"
  | "DumpCreation"
  | "SnapshotCreation"
  | "UpgradeDatabase"
>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#query-parameters}
 *
 * @see `meilisearch::routes::tasks::TasksFilterQuery`
 */
export type TasksOrBatchesQuery = Partial<{
  limit: number;
  from: number | null;
  reverse: boolean | null;
  batchUids: OptionStarOrList<number[]>;
  uids: OptionStarOrList<number[]>;
  canceledBy: OptionStarOrList<number[]>;
  types: OptionStarOrList<TaskType[]>;
  statuses: OptionStarOrList<TaskStatus[]>;
  indexUids: OptionStarOrList<string[]>;
  afterEnqueuedAt: OptionStarOr<string>;
  beforeEnqueuedAt: OptionStarOr<string>;
  afterStartedAt: OptionStarOr<string>;
  beforeStartedAt: OptionStarOr<string>;
  afterFinishedAt: OptionStarOr<string>;
  beforeFinishedAt: OptionStarOr<string>;
}>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#query-parameters-1}
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#query-parameters-2}
 *
 * @see `meilisearch::routes::tasks::TaskDeletionOrCancelationQuery`
 */
export type DeleteOrCancelTasksQuery = SafeOmit<
  TasksOrBatchesQuery,
  "limit" | "from" | "reverse"
>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#summarized-task-object}
 *
 * @see `meilisearch::routes::SummarizedTaskView`
 */
export type EnqueuedTask = {
  taskUid: number;
  indexUid: string | null;
  status: TaskStatus;
  type: TaskType;
  enqueuedAt: string;
};

/** Either a number or an {@link EnqueuedTask}. */
export type TaskUidOrEnqueuedTask = EnqueuedTask["taskUid"] | EnqueuedTask;

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#indexswap} */
export type IndexSwap = {
  indexes: [string, string];
  rename: boolean;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#details}
 *
 * @see `meilisearch_types::task_view::DetailsView`
 */
export type TaskDetails = Settings &
  Partial<{
    receivedDocuments: number;
    indexedDocuments: number;
    editedDocuments: number;
    primaryKey: string;
    providedIds: number;
    deletedDocuments: number;
    matchedTasks: number;
    canceledTasks: number;
    deletedTasks: number;
    originalFilter: string | null;
    dumpUid: string | null;
    context: Record<string, unknown> | null;
    function: string;
    swaps: IndexSwap[];
    upgradeFrom: string;
    upgradeTo: string;
  }>;

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#network} */
type Origin = { remoteName: string; taskUid: number };

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#network} */
type NetworkOrigin = { origin: Origin };

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#network} */
type RemoteTask = { taskUid?: number; error: MeiliSearchErrorResponse | null };

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#network} */
type NetworkRemoteTasks = { remoteTasks: Record<string, RemoteTask> };

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#task-object}
 *
 * @see `meilisearch_types::task_view::TaskView`
 */
export type Task = SafeOmit<EnqueuedTask, "taskUid"> & {
  uid: number;
  batchUid: number | null;
  canceledBy: number | null;
  details?: TaskDetails;
  error: MeiliSearchErrorResponse | null;
  duration: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  /** {@link https://www.meilisearch.com/docs/reference/api/tasks#network} */
  network?: NetworkOrigin | NetworkRemoteTasks;
};

/**
 * A {@link Promise} resolving to an {@link EnqueuedTask} with an extra function
 * that returns a Promise that resolves to a {@link Task}.
 */
export type EnqueuedTaskPromise = Promise<EnqueuedTask> & {
  /**
   * Function that, through polling, awaits the {@link EnqueuedTask} resolved by
   * {@link EnqueuedTaskPromise}.
   */
  waitTask: (waitOptions?: WaitOptions) => Promise<Task>;
};

type Results<T> = {
  results: T[];
  total: number;
  limit: number;
  from: number | null;
  next: number | null;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#response}
 *
 * @see `meilisearch::routes::tasks::AllTasks`
 */
export type TasksResults = Results<Task>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/batches#steps}
 *
 * @see `milli::progress::ProgressStepView`
 */
export type BatchProgressStep = {
  currentStep: string;
  finished: number;
  total: number;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/batches#progress}
 *
 * @see `milli::progress::ProgressView`
 */
export type BatchProgress = {
  steps: BatchProgressStep[];
  percentage: number;
};

/** {@link https://www.meilisearch.com/docs/reference/api/batches#stats} */
type BatchStats = {
  totalNbTasks: number;
  status: Record<TaskStatus, number>;
  types: Record<TaskType, number>;
  indexUids: Record<string, number>;
  /** {@link https://www.meilisearch.com/docs/reference/api/batches#progresstrace} */
  progressTrace?: RecordAny;
  /** {@link https://www.meilisearch.com/docs/reference/api/batches#writechannelcongestion} */
  writeChannelCongestion?: RecordAny;
  /** {@link https://www.meilisearch.com/docs/reference/api/batches#internaldatabasesizes} */
  internalDatabaseSizes?: RecordAny;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/batches#batch-object}
 *
 * @see `meilisearch_types::batch_view::BatchView`
 */
export type Batch = {
  uid: number;
  progress: BatchProgress | null;
  details: TaskDetails;
  stats: BatchStats;
  duration: string | null;
  startedAt: string;
  finishedAt: string | null;
  // batcherStoppedBecause: unknown;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/batches#response}
 *
 * @see `meilisearch::routes::batches::AllBatches`
 */
export type BatchesResults = Results<Batch>;
