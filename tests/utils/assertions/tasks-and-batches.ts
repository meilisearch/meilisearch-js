import type {
  TasksResults,
  Batch,
  TaskType,
  TaskStatus,
  EnqueuedTask,
  BatchesResults,
  Task,
} from "../../../src/types/index.js";
import { assert } from "vitest";
import { objectKeys } from "../object.js";
import { errorAssertions } from "./error.js";

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
  networkTopologyChange: null,
});

export const tasksAndBatchesAssertions = {
  isEnqueuedTask(enqueuedTask: EnqueuedTask) {
    assert.lengthOf(Object.keys(enqueuedTask), 5);

    const { taskUid, indexUid, status, type, enqueuedAt } = enqueuedTask;

    assert.typeOf(taskUid, "number");
    assert(
      indexUid === null || typeof indexUid === "string",
      `expected ${indexUid} to be null or string`,
    );
    assert.oneOf(status, possibleTaskStatuses);
    assert.oneOf(type, possibleTaskTypes);
    assert.typeOf(enqueuedAt, "string");
  },

  isBatch(batch: Batch) {
    assert.lengthOf(Object.keys(batch), 8);

    const { uid, progress, details, stats, duration, startedAt, finishedAt } =
      batch;

    assert.typeOf(uid, "number");
    assert(
      typeof progress === "object",
      "expected progress to be of type object or null",
    );

    if (progress !== null) {
      assert.lengthOf(Object.keys(progress), 2);
      const { steps, percentage } = progress;

      for (const step of steps) {
        assert.lengthOf(Object.keys(step), 3);

        const { currentStep, finished, total } = step;

        assert.typeOf(currentStep, "string");
        assert.typeOf(finished, "number");
        assert.typeOf(total, "number");
      }

      assert.typeOf(percentage, "number");
    }

    assert.typeOf(details, "object");

    const { length } = Object.keys(stats);

    assert.isAtLeast(length, 4);
    assert.isAtMost(length, 7);

    const {
      totalNbTasks,
      status,
      types,
      indexUids,
      progressTrace,
      writeChannelCongestion,
      internalDatabaseSizes,
    } = stats;

    assert.typeOf(totalNbTasks, "number");

    for (const [key, val] of Object.entries(status)) {
      assert.oneOf(key, possibleTaskStatuses);
      assert.typeOf(val, "number");
    }

    for (const [key, val] of Object.entries(types)) {
      assert.oneOf(key, possibleTaskTypes);
      assert.typeOf(val, "number");
    }

    for (const val of Object.values(indexUids)) {
      assert.typeOf(val, "number");
    }

    assert(
      progressTrace === undefined ||
        (progressTrace !== null && typeof progressTrace === "object"),
      "expected progressTrace to be undefined or an object",
    );

    assert(
      writeChannelCongestion === undefined ||
        (writeChannelCongestion !== null &&
          typeof writeChannelCongestion === "object"),
      "expected writeChannelCongestion to be undefined or an object",
    );

    assert(
      internalDatabaseSizes === undefined ||
        (internalDatabaseSizes !== null &&
          typeof internalDatabaseSizes === "object"),
      "expected internalDatabaseSizes to be undefined or an object",
    );

    assert(
      duration === null || typeof duration === "string",
      "expected duration to be null or string",
    );

    assert.typeOf(startedAt, "string");

    assert(
      finishedAt === null || typeof finishedAt === "string",
      "expected finishedAt to be null or string",
    );
  },

  isTasksOrBatchesResults(value: TasksResults | BatchesResults) {
    assert.lengthOf(Object.keys(value), 5);

    const { results, total, limit, from, next } = value;

    // it's up to individual tests to assert the exact type of each element
    assert.isArray(results);

    assert.typeOf(total, "number");
    assert.typeOf(limit, "number");

    if (from !== null) {
      assert.typeOf(from, "number");
    }

    if (next !== null) {
      assert.typeOf(next, "number");
    }
  },

  isTask(task: Task) {
    const { length } = Object.keys(task);

    assert.isAtLeast(length, 11);
    assert.isAtMost(length, 13);

    const {
      indexUid,
      status,
      type,
      enqueuedAt,
      uid,
      batchUid,
      canceledBy,
      details,
      error,
      duration,
      startedAt,
      finishedAt,
      network,
    } = task;

    assert(indexUid === null || typeof indexUid === "string");

    assert.oneOf(status, possibleTaskStatuses);

    assert.oneOf(type, possibleTaskTypes);

    assert.typeOf(enqueuedAt, "string");
    assert.typeOf(uid, "number");
    assert(batchUid === null || typeof batchUid === "number");
    assert(canceledBy === null || typeof canceledBy === "number");

    // it's up to individual tests to assert the exact shape of this property
    assert(
      details === undefined ||
        (details !== null && typeof details === "object"),
    );

    assert(typeof error === "object");
    if (error !== null) {
      errorAssertions.isErrorResponse(error);
    }

    assert(duration === null || typeof duration === "string");
    assert(startedAt === null || typeof startedAt === "string");
    assert(finishedAt === null || typeof finishedAt === "string");

    // it's up to individual tests to assert the exact shape of this property
    assert(
      network === undefined ||
        (network !== null && typeof network === "object"),
    );
  },

  isTaskSuccessful(task: Task) {
    this.isTask(task);
    assert.isNull(task.error);
    assert.strictEqual(task.status, "succeeded");
  },
};
