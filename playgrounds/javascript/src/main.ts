import "./style.css";
import { addDocuments, getAllHits, getSearchResponse } from "./meilisearch.js";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Meilisearch + Vite</h1>

    <h2>Documents:</h2>
    <div id="hits" style="white-space: break-spaces"> - </div>

    <h2>Search response:</h2>
    <div id="response" style="white-space: break-spaces"> - </div>

    <h2>Errors:</h2>
    <div id="errors">None</div>
  </div>
`;

function getErrorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return JSON.stringify(error);
  }

  const message = String(error);

  if (error.cause === undefined) {
    return message;
  }

  return `${message}\nCaused by ${getErrorMessage(error.cause)}`;
}

try {
  await addDocuments();
  await getAllHits(document.querySelector<HTMLDivElement>("#hits")!);
  await getSearchResponse(document.querySelector<HTMLDivElement>("#response")!);
} catch (error) {
  console.error(error);
  document.querySelector<HTMLDivElement>("#errors")!.innerText =
    getErrorMessage(error);
}
