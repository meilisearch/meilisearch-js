import type { HttpRequests } from "./http-requests.js";
import type {
  ChatWorkspaceSettings,
  ChatCompletionRequest,
} from "./types/types.js";

/**
 * Class for handling chat workspaces.
 *
 * @see {@link https://www.meilisearch.com/docs/reference/api/chats}
 */
export class ChatWorkspace {
  readonly #httpRequest: HttpRequests;
  readonly #workspace: string;

  constructor(httpRequests: HttpRequests, workspace: string) {
    this.#httpRequest = httpRequests;
    this.#workspace = workspace;
  }

  async get(): Promise<ChatWorkspaceSettings> {
    return await this.#httpRequest.get({
      path: `chats/${this.#workspace}/settings`,
    });
  }

  async update(
    settings: Partial<ChatWorkspaceSettings>,
  ): Promise<ChatWorkspaceSettings> {
    return await this.#httpRequest.patch({
      path: `chats/${this.#workspace}/settings`,
      body: settings,
    });
  }

  async streamCompletion(
    completion: ChatCompletionRequest,
  ): Promise<ReadableStream<Uint8Array>> {
    if (!completion.stream) {
      throw new Error("The SDK only support streaming");
    }
    return await this.#httpRequest.postStream({
      path: `chats/${this.#workspace}/chat/completions`,
      body: completion,
    });
  }
}
