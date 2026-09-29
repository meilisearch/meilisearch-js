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
 * Reads a `text/event-stream` body and yields the `data` of each event, as sent
 * by the `tasks/stream` and `batches/stream` routes.
 *
 * @remarks
 * Multi-line `data` fields are joined with a newline, as the specification
 * requires. Comment lines and the `event`, `id` and `retry` fields are ignored.
 * Leaving the loop cancels the stream, which closes the connection.
 * @see {@link https://html.spec.whatwg.org/multipage/server-sent-events.html#event-stream-interpretation}
 */
async function* readServerSentEvents(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<string, void, undefined> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let data: string[] = [];

  try {
    for (;;) {
      const { done, value } = await reader.read();

      buffer += done
        ? decoder.decode()
        : decoder.decode(value, { stream: true });

      // A last event without a trailing newline is still an event.
      if (done && buffer !== "" && !buffer.endsWith("\n")) {
        buffer += "\n";
      }

      for (
        let newline = buffer.indexOf("\n");
        newline !== -1;
        newline = buffer.indexOf("\n")
      ) {
        const line = buffer.slice(0, newline).replace(/\r$/, "");
        buffer = buffer.slice(newline + 1);

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
        if (data.length > 0) {
          yield data.join("\n");
        }
        return;
      }
    }
  } finally {
    await reader.cancel();
  }
}

/** Parses each event of a `text/event-stream` body as JSON. */
async function* readJsonEvents<T>(
  stream: ReadableStream<Uint8Array>,
): AsyncGenerator<T, void, undefined> {
  for await (const data of readServerSentEvents(stream)) {
    yield JSON.parse(data) as T;
  }
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
