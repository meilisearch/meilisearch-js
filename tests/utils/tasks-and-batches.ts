import { assert as extAssert, objectKeys } from "./meilisearch-test-utils.js";
import type {
  TasksResults,
  Batch,
  TaskType,
  TaskStatus,
  EnqueuedTask,
} from "../../src/types/index.js";
import type { SafeOmit } from "../../src/types/shared.js";

export const possibleTaskStatuses = objectKeys<TaskStatus>({
  enqueued: null,
  processing: null,
  succeeded: null,
  failed: null,
  canceled: null,
});

export const possibleTaskTypes = objectKeys<TaskType>({
  documentAdditionOrUpdate: null,
  documentEdition: null,
  documentDeletion: null,
  settingsUpdate: null,
  indexCreation: null,
  indexDeletion: null,
  indexUpdate: null,
  indexSwap: null,
  taskCancelation: null,
  taskDeletion: null,
  dumpCreation: null,
  snapshotCreation: null,
  upgradeDatabase: null,
});

const customAssertions = {
  isEnqueuedTask(summarizedTask: EnqueuedTask) {
    extAssert.lengthOf(Object.keys(summarizedTask), 5);

    const { taskUid, indexUid, status, type, enqueuedAt } = summarizedTask;

    extAssert.typeOf(taskUid, "number");
    extAssert(
      indexUid === null || typeof indexUid === "string",
      `expected ${indexUid} to be null or string`,
    );
    extAssert.oneOf(status, possibleTaskStatuses);
    extAssert.oneOf(type, possibleTaskTypes);
    extAssert.typeOf(enqueuedAt, "string");
  },

  isBatch(batch: Batch) {
    extAssert.lengthOf(Object.keys(batch), 7);

    const { uid, progress, details, stats, duration, startedAt, finishedAt } =
      batch;

    extAssert.typeOf(uid, "number");
    extAssert(
      typeof progress === "object",
      "expected progress to be of type object or null",
    );

    if (progress !== null) {
      extAssert.lengthOf(Object.keys(progress), 2);
      const { steps, percentage } = progress;

      for (const step of steps) {
        extAssert.lengthOf(Object.keys(step), 3);

        const { currentStep, finished, total } = step;

        extAssert.typeOf(currentStep, "string");
        extAssert.typeOf(finished, "number");
        extAssert.typeOf(total, "number");
      }

      extAssert.typeOf(percentage, "number");
    }

    extAssert.typeOf(details, "object");

    const { length } = Object.keys(stats);

    extAssert.isAtLeast(length, 4);
    extAssert.isAtMost(length, 7);

    const {
      totalNbTasks,
      status,
      types,
      indexUids,
      progressTrace,
      writeChannelCongestion,
      internalDatabaseSizes,
    } = stats;

    extAssert.typeOf(totalNbTasks, "number");

    for (const [key, val] of Object.entries(status)) {
      extAssert.oneOf(key, possibleTaskStatuses);
      extAssert.typeOf(val, "number");
    }

    for (const [key, val] of Object.entries(types)) {
      extAssert.oneOf(key, possibleTaskTypes);
      extAssert.typeOf(val, "number");
    }

    for (const val of Object.values(indexUids)) {
      extAssert.typeOf(val, "number");
    }

    extAssert(
      progressTrace === undefined ||
        (progressTrace !== null && typeof progressTrace === "object"),
      "expected progressTrace to be undefined or an object",
    );

    extAssert(
      writeChannelCongestion === undefined ||
        (writeChannelCongestion !== null &&
          typeof writeChannelCongestion === "object"),
      "expected writeChannelCongestion to be undefined or an object",
    );

    extAssert(
      internalDatabaseSizes === undefined ||
        (internalDatabaseSizes !== null &&
          typeof internalDatabaseSizes === "object"),
      "expected internalDatabaseSizes to be undefined or an object",
    );

    extAssert(
      duration === null || typeof duration === "string",
      "expected duration to be null or string",
    );
    extAssert(
      startedAt === null || typeof startedAt === "string",
      "expected startedAt to be null or string",
    );
    extAssert(
      finishedAt === null || typeof finishedAt === "string",
      "expected finishedAt to be null or string",
    );
  },

  isResult(value: SafeOmit<TasksResults, "results">) {
    extAssert.lengthOf(Object.keys(value), 4);
    extAssert.typeOf(value.total, "number");
    extAssert.typeOf(value.limit, "number");
    extAssert(
      value.from === null || typeof value.from === "number",
      "expected from to be null or number",
    );
    extAssert(
      value.next === null || typeof value.next === "number",
      "expected next to be null or number",
    );
  },
};

export const assert: typeof extAssert & typeof customAssertions = Object.assign(
  extAssert,
  customAssertions,
);
