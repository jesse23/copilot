import { Voy as VoyClient } from "voy-search";
import { VoyVectorStore } from "@langchain/community/vectorstores/voy";
import { HuggingFaceTransformersEmbeddings } from "@langchain/community/embeddings/hf_transformers";
import { INDICATOR_SAMPLES } from "./indicator-samples";

// https://github.com/jacoblee93/fully-local-pdf-chatbot/tree/ceb260ab7c7a9398f55397fe7f50cb65a5fa2557
// https://js.langchain.com/docs/modules/chains/popular/chat_vector_db
// https://github.com/tantaraio/voy/

const _ctx = {
  vStorePromise: null as Promise<VoyVectorStore>,
};

export const queryVectorStore = async (query) => {
  const vs = await _ctx.vStorePromise;
  return vs.similaritySearch(query, 3);
};

export const initVectorStore = async () => {
  if(!_ctx.vStorePromise) {
    _ctx.vStorePromise = _initVectorStore();
  }
  return _ctx.vStorePromise;
}

const _initVectorStore = async () => {
  const vs = new VoyVectorStore(
    new VoyClient(),
    new HuggingFaceTransformersEmbeddings({
      modelName: "Xenova/all-MiniLM-L6-v2",
    })
  );

  for (let text of INDICATOR_SAMPLES.split("\n")) {
    await vs.addDocuments([
      { pageContent: text, metadata: { category: "example" } },
    ]);
  }
  return vs;
};
