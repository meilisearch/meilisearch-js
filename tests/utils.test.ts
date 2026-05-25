import { describe, expect, test } from "vitest";
import { parseTaskDocuments, readStreamAsText } from "../src/utils.js";

function streamFromText(
  text: string,
  chunkSize = text.length,
): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(text);
  let offset = 0;

  return new ReadableStream<Uint8Array>({
    pull(controller) {
      if (offset >= bytes.length) {
        controller.close();
        return;
      }

      controller.enqueue(bytes.subarray(offset, offset + chunkSize));
      offset += chunkSize;
    },
  });
}

describe("readStreamAsText", () => {
  test("decodes an empty stream", async () => {
    await expect(readStreamAsText(streamFromText(""))).resolves.toBe("");
  });

  test("decodes UTF-8 text from a single chunk", async () => {
    await expect(readStreamAsText(streamFromText('{"id":1}'))).resolves.toBe(
      '{"id":1}',
    );
  });

  test("decodes UTF-8 text split across multiple chunks", async () => {
    const text = '{"id":1,"title":"café"}';

    await expect(readStreamAsText(streamFromText(text, 4))).resolves.toBe(text);
  });
});

describe("parseTaskDocuments", () => {
  test("returns an empty array for empty or whitespace payloads", () => {
    expect(parseTaskDocuments("")).toEqual([]);
    expect(parseTaskDocuments("   \n  ")).toEqual([]);
  });

  test("parses a JSON array", () => {
    expect(parseTaskDocuments('[{"id":1},{"id":2}]')).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
  });

  test("wraps a single JSON object in an array", () => {
    expect(parseTaskDocuments('{"id":1}')).toEqual([{ id: 1 }]);
  });

  test("parses NDJSON payloads", () => {
    expect(parseTaskDocuments('{"id":1}\n{"id":2}')).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
  });

  test("parses concatenated JSON objects without separators", () => {
    expect(parseTaskDocuments('{"id":1}{"id":2}')).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
  });

  test("parses concatenated JSON objects separated by whitespace", () => {
    expect(parseTaskDocuments('{"id":1} {"id":2}')).toEqual([
      { id: 1 },
      { id: 2 },
    ]);
  });
});
