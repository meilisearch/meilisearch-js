export class MeiliSearchError extends Error {
  override name = "MeiliSearchError";

  constructor(...params: ConstructorParameters<typeof Error>) {
    super(...params);
  }
}
