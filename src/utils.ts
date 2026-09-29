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
 * Longest line accepted from a `text/event-stream` body. A task or batch event
 * weighs a few kilobytes; a peer that never ends a line must not grow the
 * buffer without bound.
 */
const MAX_SSE_LINE_LENGTH = 1_048_576;

/** Cancels a reader once, and never lets the cancellation mask another error. */
function cancelOnce(reader: ReadableStreamDefaultReader<Uint8Array>) {
  let cancelled = false;
  return async (): Promise<void> => {
    if (cancelled) {
      return;
    }
    cancelled = true;
    try {
      await reader.cancel();
    } catch {
      // The stream is already closed or errored: nothing left to cancel.
    }
  };
}

/**
 * Makes `return()` close the underlying stream even when the generator was
 * never started. A generator's `finally` only runs once its body has started,
 * so a caller that abandons the iterator before the first `next()` would
 * otherwise leave the connection open.
 */
function closeOnReturn<T>(
  generator: AsyncGenerator<T, void, undefined>,
  close: () => Promise<void>,
): AsyncGenerator<T, void, undefined> {
  const originalReturn = generator.return.bind(generator);
  generator.return = async (value?: void | PromiseLike<void>) => {
    await close();
    return await originalReturn(value);
  };
  return generator;
}

async function* parseServerSentEvents(
  reader: ReadableStreamDefaultReader<Uint8Array>,
  cancel: () => Promise<void>,
): AsyncGenerator<string, void, undefined> {
  const decoder = new TextDecoder();
  let buffer = "";
  let data: string[] = [];

  try {
    for (;;) {
      const { done, value } = await reader.read();

      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });

      for (;;) {
        const cr = buffer.indexOf("\r");
        const lf = buffer.indexOf("\n");
        const end = cr === -1 ? lf : lf === -1 ? cr : Math.min(cr, lf);

        if (end === -1) {
          if (buffer.length > MAX_SSE_LINE_LENGTH) {
            throw new MeilisearchError(
              `A line of the event stream exceeds ${MAX_SSE_LINE_LENGTH} characters`,
            );
          }
          break;
        }

        // A trailing CR may be the first half of a CRLF split between chunks.
        if (buffer[end] === "\r" && end === buffer.length - 1 && !done) {
          break;
        }

        const line = buffer.slice(0, end);
        const delimiterLength =
          buffer[end] === "\r" && buffer[end + 1] === "\n" ? 2 : 1;
        buffer = buffer.slice(end + delimiterLength);

        if (line === "") {
          if (data.length > 0) {
            yield data.join("\n");
            data = [];
          }
          continue;
        }

        if (line.startsWith(":")) {
          continue;
        }

        const colon = line.indexOf(":");
        const field = colon === -1 ? line : line.slice(0, colon);

        if (field === "data") {
          const fieldValue = colon === -1 ? "" : line.slice(colon + 1);
          data.push(
            fieldValue.startsWith(" ") ? fieldValue.slice(1) : fieldValue,
          );
        }
      }

      if (done) {
        // The specification discards an event the stream did not terminate.
        return;
      }
    }
  } finally {
    await cancel();
  }
}

/**
 * Reads a `text/event-stream` body and yields the `data` of each event, as sent
 * by the `tasks/stream` and `batches/stream` routes.
 *
 * @remarks
 * Multi-line `data` fields are joined with a newline, as the specification
 * requires. Comment lines and the `event`, `id` and `retry` fields are ignored,
 * and so is an event the stream ends in the middle of. Leaving the loop, or
 * calling `return()` on the generator, cancels the stream, which closes the
 * connection.
 * @see {@link https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation}
 */
function readServerSentEvents(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, undefined> {
  const reader = stream.getReader();
  const cancel = cancelOnce(reader);
  return closeOnReturn(parseServerSentEvents(reader, cancel), cancel);
}

async function* mapJsonEvents<T>(
  events: AsyncGenerator<string, void, undefined>,
): AsyncGenerator<T, void, undefined> {
  for await (const data of events) {
    yield JSON.parse(data) as T;
  }
}

/** Parses each event of a `text/event-stream` body as JSON. */
function readJsonEvents<T>(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<T, void, undefined> {
  const events = readServerSentEvents(stream);
  return closeOnReturn(mapJsonEvents<T>(events), async () => {
    await events.return();
  });
}

export {
  sleep,
  addProtocolIfNotPresent,
  addTrailingSlash,
  readStreamAsText,
  parseTaskDocuments,
  readServerSentEvents,
  readJsonEvents,
};
