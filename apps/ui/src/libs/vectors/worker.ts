import { Voy as VoyClient } from "voy-search";
import { VoyVectorStore } from "@langchain/community/vectorstores/voy";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
// import { INDICATOR_SAMPLES } from "./indicator-samples";
import { CMD_SAMPLES, ANCHOR_SAMPLES } from "./cmd-samples";

// https://github.com/jacoblee93/fully-local-pdf-chatbot/tree/ceb260ab7c7a9398f55397fe7f50cb65a5fa2557
// https://js.langchain.com/docs/modules/chains/popular/chat_vector_db
// https://github.com/tantaraio/voy/

const _ctx = {
  vStorePromise: null as Promise<{
    cmdStore: VoyVectorStore;
    anchorStore: VoyVectorStore;
  }>,
};

export const queryCommand = async (query) => {
  const vs = (await _ctx.vStorePromise).cmdStore;
  return vs.similaritySearch(query, 3);
};

export const queryAnchor = async (query) => {
  const vs = (await _ctx.vStorePromise).anchorStore;
  return vs.similaritySearch(query, 3);
};

export const initVectorStore = async () => {
  if (!_ctx.vStorePromise) {
    _ctx.vStorePromise = _initVectorStore();
  }
  return _ctx.vStorePromise;
};

const _initVectorStore = async () => {
  const cmdStore = new VoyVectorStore(
    new VoyClient(),
    new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    })
  );

  const anchorStore = new VoyVectorStore(
    new VoyClient(),
    new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    })
  );

  const cmdSamples = CMD_SAMPLES.split("\n");
  //const cmdSamples = [];
  for (let idx in cmdSamples) {
    console.log(`Adding command ${idx} of ${cmdSamples.length}`);
    await cmdStore.addDocuments([
      { pageContent: cmdSamples[idx], metadata: { category: "example" } },
    ]);
  }

  const anchorSamples = ANCHOR_SAMPLES.split("\n");
  // const anchorSamples = [];
  for (let idx in anchorSamples) {
    console.log(`Adding anchor ${idx} of ${anchorSamples.length}`);
    await anchorStore.addDocuments([
      { pageContent: anchorSamples[idx], metadata: { category: "example" } },
    ]);
  }

  return {
    cmdStore,
    anchorStore,
  };
};

initVectorStore();

self.onmessage = async (e) => {
  const query = e.data;
  if (query._vector) {
    let embeddings = [];
    if (query.type === "command") {
      embeddings = await queryCommand(query.query);
    } else if (query.type === "anchor") {
      embeddings = await queryAnchor(query.query);
    }
    self.postMessage(JSON.stringify(embeddings));
  }
};
