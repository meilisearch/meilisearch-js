import { afterAll, assert, beforeAll, describe, expect, test } from "vitest";
import type { Batch, Task } from "../src/types/index.js";
import {
  MeilisearchApiError,
  MeilisearchError,
  MeilisearchRequestError,
} from "../src/errors/index.js";
import { readJsonEvents, readServerSentEvents } from "../src/utils.js";
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
      ).rejects.toBeInstanceOf(MeilisearchApiError);
      await expect(
        client.batches.streamBatches(streamTimeout()),
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
  const streamOf = (...chunks: string[]): ReadableStream<Uint8Array> => {
    const encoder = new TextEncoder();
    return new ReadableStream({
      start(controller) {
        for (const chunk of chunks) {
          controller.enqueue(encoder.encode(chunk));
        }
        controller.close();
      },
    });
  };

  const collect = async (
    stream: ReadableStream<Uint8Array>,
  ): Promise<string[]> => {
    const events: string[] = [];
    for await (const data of readServerSentEvents(stream)) {
      events.push(data);
    }
    return events;
  };

  test("Yields the data of each event and ignores retry, comments and other fields", async () => {
    const events = await collect(
      streamOf(
        "retry: 10000\n\n",
        ": a comment\n",
        'event: task\nid: 1\ndata: {"uid":1}\n\n',
        'data:{"uid":2}\n\n',
      ),
    );
    assert.deepEqual(events, ['{"uid":1}', '{"uid":2}']);
  });

  test("Reassembles events split across chunks and accepts CRLF", async () => {
    const events = await collect(
      streamOf('data: {"ui', 'd":3}\r\n\r\ndata: {"u', 'id":4}\r\n', "\r\n"),
    );
    assert.deepEqual(events, ['{"uid":3}', '{"uid":4}']);
  });

  test("Joins multi-line data with a newline and discards an event the stream did not terminate", async () => {
    const events = await collect(
      streamOf("data: first\ndata: second\n\ndata: unterminated"),
    );
    assert.deepEqual(events, ["first\nsecond"]);
  });

  test("Accepts CR alone as a line ending, and a CRLF split between chunks", async () => {
    assert.deepEqual(await collect(streamOf("data: 1\r\rdata: 2\r\r")), [
      "1",
      "2",
    ]);
    assert.deepEqual(
      await collect(streamOf("data: a\r", "\ndata: b\r", "\n\r", "\n")),
      ["a\nb"],
    );
  });

  test("Rejects a line that never ends instead of buffering it forever", async () => {
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(65_536)));
      },
    });

    await expect(collect(stream)).rejects.toBeInstanceOf(MeilisearchError);
  });

  test("Closes the stream when return() is called before the first next()", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      cancel() {
        cancelled = true;
      },
    });

    await readServerSentEvents(stream).return();
    assert.isTrue(cancelled);

    cancelled = false;
    await readJsonEvents(
      new ReadableStream<Uint8Array>({
        cancel() {
          cancelled = true;
        },
      }),
    ).return();
    assert.isTrue(cancelled);
  });

  test("Cancels the stream when the consumer stops early", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("data: 1\n\ndata: 2\n\n"));
      },
      cancel() {
        cancelled = true;
      },
    });

    for await (const data of readServerSentEvents(stream)) {
      assert.strictEqual(data, "1");
      break;
    }

    assert.isTrue(cancelled);
  });
});
