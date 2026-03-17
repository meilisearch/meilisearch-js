import { assert } from "vitest";
import { errorAssertions } from "./assertions/error.js";
import { promiseAssertions } from "./assertions/promise.js";
import { tasksAndBatchesAssertions } from "./assertions/tasks-and-batches.js";

const source = {
  ...errorAssertions,
  ...promiseAssertions,
  ...tasksAndBatchesAssertions,
};

const customAssert: typeof assert & typeof source = Object.assign(
  assert,
  source,
);

// needs to be named assert to satisfy Vitest OXLint plugin in tests
export { customAssert as assert };
