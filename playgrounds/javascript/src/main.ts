import "./style.css";
import { addDocuments, getAllHits, getSearchResponse } from "./meilisearch.js";

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Meilisearch + Vite</h1>

    <h2>Documents:</h2>
    <div id="hits" style="white-space: break-spaces"> - </div>

    <h2>Search response:</h2>
    <div id="response" style="white-space: break-spaces"> - </div>

    <h2 class="errors_title">Errors:</h2>
    <div id="errors" style="white-space: break-spaces">None</div>
  </div>
`;

try {
  await addDocuments();
  await getAllHits(document.querySelector<HTMLDivElement>("#hits")!);
  await getSearchResponse(document.querySelector<HTMLDivElement>("#response")!);
} catch (error) {
  console.error(error);
  document.querySelector<HTMLDivElement>("#errors")!.innerText = JSON.stringify(
    error,
    null,
    4,
  );
}
