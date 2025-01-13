import { Meilisearch } from "../../../src";

const config = {
  host: "http://127.0.0.1:7700",
  apiKey: "masterKey",
};

const client = new Meilisearch(config);
const indexUid = "movies";

const addDataset = async () => {
  await client.deleteIndex(indexUid).waitTask();
  await client.createIndex(indexUid).waitTask();

  const documents = await client.index(indexUid).getDocuments();

  const dataset = [
    { id: 1, title: "Carol", genres: ["Romance", "Drama"] },
    { id: 2, title: "Wonder Woman", genres: ["Action", "Adventure"] },
    { id: 3, title: "Life of Pi", genres: ["Adventure", "Drama"] },
    {
      id: 4,
      title: "Mad Max: Fury Road",
      genres: ["Adventure", "Science Fiction"],
    },
    { id: 5, title: "Moana", genres: ["Fantasy", "Action"] },
    { id: 6, title: "Philadelphia", genres: ["Drama"] },
  ];
  if (documents.results.length === 0) {
    await client.index(indexUid).addDocuments(dataset).waitTask();
  }
};

(async () => {
  try {
    await addDataset();
    const indexes = await client.getRawIndexes();
    document.querySelector(".indexes").innerText = JSON.stringify(
      indexes,
      null,
      1,
    );
    const resp = await client.index(indexUid).search("", {
      attributesToHighlight: ["title"],
    });
    console.log({ resp });
    console.log({ hit: resp.hits[0] });
    document.querySelector(".hits").innerText = JSON.stringify(
      resp.hits.map((hit) => hit.title),
      null,
      1,
    );
    document.querySelector(".errors_title").style.display = "none";
  } catch (e) {
    console.error(e);
    document.querySelector(".errors").innerText = JSON.stringify(e, null, 1);
  }
})();
