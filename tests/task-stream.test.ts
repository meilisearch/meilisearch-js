import { afterAll, assert, beforeAll, describe, expect, test } from "vitest";
import type { Batch, Task } from "../src/types/index.js";
import {
  MeilisearchError,
  MeilisearchRequestError,
} from "../src/errors/index.js";
import { readJsonEvents } from "../src/utils.js";
import {
  BAD_HOST,
  clearAllIndexes,
  config,
  getClient,
  Meilisearch,
} from "./utils/meilisearch-test-utils.js";

const index = {
  uid: "movies_test_stream",
};

/** Ten seconds is far more than a task needs; it only prevents a hanging test. */
const streamTimeout = () => ({ signal: AbortSignal.timeout(10_000) });

beforeAll(async () => {
  const client = await getClient("Master");
  await client.updateExperimentalFeatures({ tasksStreamingRoute: true });
});

afterAll(async () => {
  const client = await getClient("Master");
  await client.updateExperimentalFeatures({ tasksStreamingRoute: false });
  await clearAllIndexes(config);
});

describe.each([{ permission: "Master" }, { permission: "Admin" }])(
  "Test on task and batch streams",
  ({ permission }) => {
    test(`${permission} key: Stream the changes of a task until it succeeds`, async () => {
      const client = await getClient(permission);

      // The stream must be open before the task is enqueued to see its changes.
      const events = await client.tasks.streamTasks(streamTimeout());
      const { taskUid } = await client.createIndex(index.uid);

      const statuses: Task["status"][] = [];
      for await (const task of events) {
        if (task.uid !== taskUid) {
          continue;
        }
        expect(task.type).toBe("indexCreation");
        expect(task.indexUid).toBe(index.uid);
        statuses.push(task.status);
        if (task.status !== "enqueued" && task.status !== "processing") {
          break;
        }
      }

      assert.strictEqual(statuses.at(-1), "succeeded");
      assert.isTrue(statuses.includes("processing"));

      await client.deleteIndex(index.uid).waitTask();
    });

    test(`${permission} key: Stream the changes of a batch until it finishes`, async () => {
      const client = await getClient(permission);

      const events = await client.batches.streamBatches(streamTimeout());
      const { taskUid } = await client.createIndex(index.uid);
      const { batchUid } = await client.tasks.waitForTask(taskUid);

      let finished: Batch | undefined;
      for await (const batch of events) {
        if (batch.uid !== batchUid) {
          continue;
        }
        expect(batch.stats.indexUids).toHaveProperty(index.uid);
        if (batch.finishedAt !== null) {
          finished = batch;
          break;
        }
      }

      assert.isDefined(finished);
      assert.strictEqual(finished.stats.status.succeeded, 1);

      await client.deleteIndex(index.uid).waitTask();
    });
  },
);

describe("Task stream errors", () => {
  test("Fails with feature_not_enabled when the experimental feature is off", async () => {
    const client = await getClient("Master");
    await client.updateExperimentalFeatures({ tasksStreamingRoute: false });

    try {
      await expect(
        client.tasks.streamTasks(streamTimeout()),
      ).rejects.toHaveProperty("cause.code", "feature_not_enabled");
    } finally {
      await client.updateExperimentalFeatures({ tasksStreamingRoute: true });
    }
  });

  test("Fails with MeilisearchRequestError on a bad host", async () => {
    const client = new Meilisearch({ host: BAD_HOST });
    await expect(client.tasks.streamTasks()).rejects.toBeInstanceOf(
      MeilisearchRequestError,
    );
  });
});

describe("Server-sent events reader", () => {
  const encoder = new TextEncoder();

  const streamOf = (...chunks: string[]): ReadableStream<Uint8Array> =>
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });

  const collect = async (
    stream: ReadableStream<Uint8Array>,
  ): Promise<unknown[]> => {
    const events: unknown[] = [];
    for await (const event of readJsonEvents(stream)) {
      events.push(event);
    }
    return events;
  };

  test.each([
    {
      name: "an event split across chunks",
      chunks: ['data: {"ui', 'd":3}\n\ndata: {"u', 'id":4}\n\n'],
      expected: [{ uid: 3 }, { uid: 4 }],
    },
    {
      name: "CRLF, CR alone, and a CRLF split between chunks",
      chunks: ["data: 1\r\n\r\n", "data: 2\r\rdata: 3\r", "\n\r", "\n"],
      expected: [1, 2, 3],
    },
    {
      name: "multi-line data joined with a newline",
      chunks: ["data: [1,\ndata: 2]\n\n"],
      expected: [[1, 2]],
    },
    {
      name: "retry, comments, event and id fields, ignored",
      chunks: [
        "retry: 10000\n\n: comment\nevent: task\nid: 1\ndata: 5\n\ndata:6\n\n",
      ],
      expected: [5, 6],
    },
    {
      name: "an event the stream did not terminate, discarded",
      chunks: ["data: 7\n\ndata: 8"],
      expected: [7],
    },
  ])("Parses $name", async ({ chunks, expected }) => {
    assert.deepEqual(await collect(streamOf(...chunks)), expected);
  });

  test("Rejects a line that never ends instead of buffering it forever", async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(encoder.encode("x".repeat(65_536)));
      },
    });

    await expect(collect(stream)).rejects.toBeInstanceOf(MeilisearchError);
  });

  test("Cancels the stream when the consumer stops early, or never starts", async () => {
    let cancelled = 0;
    const stream = () =>
      new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(encoder.encode("data: 1\n\ndata: 2\n\n"));
        },
        cancel() {
          cancelled += 1;
        },
      });

    for await (const event of readJsonEvents(stream())) {
      assert.strictEqual(event, 1);
      break;
    }
    assert.strictEqual(cancelled, 1);

    await readJsonEvents(stream()).return();
    assert.strictEqual(cancelled, 2);
  });
});
