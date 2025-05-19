import type { Settings } from "./types.js";
import type {
  PascalToCamelCase,
  SafeOmit,
  OptionStarOr,
  OptionStarOrList,
} from "./shared.js";
import type { MeiliSearchErrorResponse } from "./types.js";

/** Options for awaiting {@link SummarizedTaskView}. */
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
export type Status = PascalToCamelCase<
  "Enqueued" | "Processing" | "Succeeded" | "Failed" | "Canceled"
>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#type}
 *
 * @see `meilisearch_types::tasks::Kind`
 */
export type Kind = PascalToCamelCase<
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
export type TasksFilterQuery = Partial<{
  limit: number;
  from: number | null;
  reverse: boolean | null;
  batchUids: OptionStarOrList<number[]>;
  uids: OptionStarOrList<number[]>;
  canceledBy: OptionStarOrList<number[]>;
  types: OptionStarOrList<Kind[]>;
  statuses: OptionStarOrList<Status[]>;
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
export type TaskDeletionOrCancelationQuery = SafeOmit<
  TasksFilterQuery,
  "limit" | "from" | "reverse"
>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#summarized-task-object}
 *
 * @see `meilisearch::routes::SummarizedTaskView`
 */
export type SummarizedTaskView = {
  taskUid: number;
  indexUid: string | null;
  status: Status;
  type: Kind;
  enqueuedAt: string;
};

/** Either a number or a {@link SummarizedTaskView}. */
export type TaskUidOrSummarizedTaskView =
  | SummarizedTaskView["taskUid"]
  | SummarizedTaskView;

/** {@link https://www.meilisearch.com/docs/reference/api/tasks#indexswap} */
export type IndexSwap = { indexes: [string, string] };

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#details}
 *
 * @see `meilisearch_types::task_view::DetailsView`
 */
export type DetailsView = Settings &
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

/**
 * {@link https://www.meilisearch.com/docs/reference/api/tasks#task-object}
 *
 * @see `meilisearch_types::task_view::TaskView`
 */
export type TaskView = SafeOmit<SummarizedTaskView, "taskUid"> & {
  uid: number;
  batchUid: number | null;
  canceledBy: number | null;
  details?: DetailsView;
  error: MeiliSearchErrorResponse | null;
  duration: string | null;
  startedAt: string | null;
  finishedAt: string | null;
};

/**
 * A {@link Promise} resolving to a {@link SummarizedTaskView} with an extra
 * function that returns a Promise that resolves to a {@link TaskView}.
 */
export type SummarizedTaskPromise = Promise<SummarizedTaskView> & {
  /**
   * Function that, through polling, awaits the {@link SummarizedTaskView}
   * resolved by {@link SummarizedTaskPromise}.
   */
  waitTask: (waitOptions?: WaitOptions) => Promise<TaskView>;
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
export type AllTasks = Results<TaskView>;

/**
 * {@link https://www.meilisearch.com/docs/reference/api/batches#steps}
 *
 * @see `milli::progress::ProgressStepView`
 */
type ProgressStepView = {
  currentStep: string;
  finished: number;
  total: number;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/batches#progress}
 *
 * @see `milli::progress::ProgressView`
 */
type ProgressView = {
  steps: ProgressStepView[];
  percentage: number;
};

/** {@link https://www.meilisearch.com/docs/reference/api/batches#stats} */
type BatchStats = {
  totalNbTasks: number;
  status: Record<Status, number>;
  types: Record<Kind, number>;
  indexUids: Record<string, number>;
  /** {@link https://www.meilisearch.com/docs/reference/api/batches#progresstrace} */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  progressTrace?: Record<string, any>;
  /** {@link https://www.meilisearch.com/docs/reference/api/batches#writechannelcongestion} */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeChannelCongestion?: Record<string, any>;
  /** {@link https://www.meilisearch.com/docs/reference/api/batches#internaldatabasesizes} */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  internalDatabaseSizes?: Record<string, any>;
};

/**
 * {@link https://www.meilisearch.com/docs/reference/api/batches#batch-object}
 *
 * @see `meilisearch_types::batch_view::BatchView`
 */
export type BatchView = {
  uid: number;
  progress: ProgressView | null;
  details: DetailsView;
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
export type AllBatches = Results<BatchView>;
