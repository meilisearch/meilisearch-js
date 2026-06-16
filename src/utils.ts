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

export {
  sleep,
  addProtocolIfNotPresent,
  addTrailingSlash,
  readStreamAsText,
  parseTaskDocuments,
};
