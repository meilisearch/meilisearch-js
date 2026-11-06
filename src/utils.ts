import { MeilisearchError } from "./errors/index.js";
import type { RecordAny } from "./types/index.js";

async function sleep(ms: number): Promise<void> {
  return await new Promise((resolve) => setTimeout(resolve, ms));
}

function addProtocolIfNotPresent(host: string): string {
  if (!(host.startsWith("https://") || host.startsWith("http://"))) {
    return `http://${host}`;
  }
  return host;
}

function addTrailingSlash(url: string): string {
  if (!url.endsWith("/")) {
    url += "/";
  }
  return url;
}

/** Reads a byte stream to completion and decodes it as UTF-8 text. */
async function readStreamAsText(
  stream: ReadableStream<Uint8Array>,
): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let text = "";

  for (;;) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    text += decoder.decode(value, { stream: true });
  }

  text += decoder.decode();

  return text;
}

/**
 * Parses task document payloads returned by `tasks/{uid}/documents`.
 *
 * @remarks
 * The endpoint may return either valid JSON (single object or array), NDJSON,
 * or concatenated JSON objects without separators. This parser normalizes all
 * of these formats into a regular document array.
 */
function parseTaskDocuments<D extends RecordAny = RecordAny>(
  rawDocuments: string,
): D[] {
  const payload = rawDocuments.trim();

  if (!payload) {
    return [];
  }

  try {
    const parsed = JSON.parse(payload) as D | D[];
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch {
    return payload
      .split(/\r?\n/)
      .flatMap((line) => line.split(/(?<=})\s*(?=\{)/))
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0)
      .map((chunk) => JSON.parse(chunk) as D);
  }
}

/**
 * Longest event accepted from a `text/event-stream` body, counting the `data`
 * lines already received and the line being read. A task or batch event weighs
 * a few kilobytes; a peer that never ends a line, or never ends an event, must
 * not grow the buffers without bound.
 */
const MAX_SSE_EVENT_LENGTH = 1_048_576;

/** Cancels a reader without masking the error that may have stopped the read. */
async function cancelQuietly(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): Promise<void> {
  try {
    await reader.cancel();
  } catch {
    // The stream is already closed or errored: nothing left to cancel.
  }
}

async function* parseJsonEvents<T>(
  reader: ReadableStreamDefaultReader<Uint8Array>,
): AsyncGenerator<T, void, undefined> {
  const decoder = new TextDecoder();
  let buffer = "";
  let data: string[] = [];
  let dataLength = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();

      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });

      for (;;) {
        const lineEnd = buffer.indexOf("\n");
        const lineLength = lineEnd === -1 ? buffer.length : lineEnd;

        if (dataLength + lineLength > MAX_SSE_EVENT_LENGTH) {
          throw new MeilisearchError(
            `An event of the stream exceeds ${MAX_SSE_EVENT_LENGTH} characters`,
          );
        }

        if (lineEnd === -1) {
          break;
        }

        // Meilisearch ends its lines with LF; dropping a trailing CR also
        // accepts CRLF, wherever a chunk boundary falls.
        const line = buffer.slice(0, lineEnd).replace(/\r$/, "");
        buffer = buffer.slice(lineEnd + 1);

        if (line === "") {
          if (data.length > 0) {
            yield JSON.parse(data.join("\n")) as T;
            data = [];
            dataLength = 0;
          }
        } else if (line.startsWith("data:")) {
          const value = line.slice(line.startsWith("data: ") ? 6 : 5);
          data.push(value);
          dataLength += value.length;
        }
        // Comments and the `event`, `id` and `retry` fields are ignored.
      }

      if (done) {
        // The specification discards an event the stream did not terminate.
        return;
      }
    }
  } finally {
    await cancelQuietly(reader);
  }
}

/**
 * Reads a `text/event-stream` body and yields the `data` of each event parsed
 * as JSON, as sent by the `tasks/stream` and `batches/stream` routes.
 *
 * @remarks
 * Leaving the loop, or calling `return()` on the generator, cancels the stream,
 * which closes the connection.
 * @see {@link https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation}
 */
function readJsonEvents<T>(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<T, void, undefined> {
  const reader = stream.getReader();
  const events = parseJsonEvents<T>(reader);

  // The generator's `finally` only runs once its body has started: a caller
  // that abandons the iterator before the first `next()` must still close it.
  const generatorReturn = events.return.bind(events);
  events.return = async (value?: void | PromiseLike<void>) => {
    await cancelQuietly(reader);
    return await generatorReturn(value);
  };

  return events;
}

export {
  sleep,
  addProtocolIfNotPresent,
  addTrailingSlash,
  readStreamAsText,
  parseTaskDocuments,
  readJsonEvents,
};
