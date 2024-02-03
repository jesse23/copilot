import {
  CATEGORY_CHAT,
  CATEGORY_JS_COMPLETION,
  CATEGORY_JS_COMPLETION_INLINE,
  CATEGORY_INDICATOR_HELPER,
  CATEGORY_INDICATOR_HELPER_INLINE,
} from "../../const";
import * as webllm from "@mlc-ai/web-llm";
import appConfig from "./app_config";
import { queryVectorStore } from "..";

const PROMPTS = {
  /// what is 'Detroit'?
  [CATEGORY_CHAT]: `
    <s>[INST]You are a helpful assistant that can answer any question in one sentence.[/INST]<s>
    `,
  [CATEGORY_JS_COMPLETION]: `
    <s>[INST]You are a helpful code assistant. Your task is to complete the javascript code for the ask in js file. You should only return the code. No steps or explanations.[/INST]</s>
    `.trim(),
  [CATEGORY_JS_COMPLETION_INLINE]: `
    <s>[INST]You are a helpful code assistant. Your task is to complete the javascript code from input. You should only return the new completion part. No explanation needed.[/INST]</s>
    `.trim(),
};

const createPrompt = (category: string, query: string) => {
  return `${PROMPTS[category]}[INST]${query}[/INST]`;
};

const createIndicatorPromptWithRetrieval = async (query: string) => {
    // retrieval augmented generation
    const embeddings = await queryVectorStore(query);

    const examples = embeddings
      // only get example with score > 0.5. voy vector store is not returning so skip it for now
      .filter(
        (item) => item.metadata.category === "example" // && item.score > 0.5
      )
      // only get the first 2 for size limitation
      .slice(0, 2)
      .map((item) => JSON.stringify(JSON.parse(item.pageContent),null,2));
    
      const prompt = `<s>[INST]
# Instruction
You are a helpful assistant to complete a JSON definition for indicators in a APP. The example is in the indicator.json. The response should be a complete JSON, without explanation.

# Object Traversal
The "prop" section  defines the traversal start from a given object, to the next type and so on. modelTypes defines the start object type. For example, given 'WorkspaceObject.release_status_list>ReleaseStatus.object_Name', if I want to show indicator with icon 'ReleaseApproved' it will be written as:
    \`\`\`
    {
      "iconName": "ReleasedApproved",
      "tooltip": {
        "showPropDisplayName": false,
        "propNames": ["object_name", "date_released"]
      },
      "prop": {
        "names": ["release_status_list"],
        "type": {
          "names": ["ReleaseStatus"],
          "prop": {
            "names": ["object_name"],
            "conditions": { "object_name": { "$eq": "Approved" } }
          }
        }
      },
      "modelTypes": ["WorkspaceObject"]
    }
    \`\`\`

# Other Examples
\`\`\`json
${examples.join("\n")}
\`\`\`[/INST]<s>
[INST]${query}[/INST]
      `;
      console.log(prompt);
      return prompt;
}

const ctx = {
  clientChatInitPromise: null,
};

const createChat = async (
  { model, progressCallback } = {} as {
    model: string;
    progressCallback?: (msg: string, step?: number) => void;
  }
) => {
  // Use a chat worker client instead of ChatModule here
  const chat = new webllm.ChatWorkerClient(
    new Worker(new URL("./worker.ts", import.meta.url), { type: "module" })
  );

  chat.setInitProgressCallback((report: webllm.InitProgressReport) => {
    // setLabel("init-label", report.text);
    // console.log(report.text);
    progressCallback?.(report.text);
  });

  await chat.reload(model, undefined, appConfig);

  return {
    generate: async (prompt: string) => {
      const resp = await chat.generate(
        prompt,
        (_step: number, message: string) => {
          // setLabel("generate-label", message);
          progressCallback?.(message, _step);
        }
      );

      progressCallback?.(await chat.runtimeStatsText());

      return resp;
    },
  };
};

export const queryLLM = async (category: string, query: string) => {
  if (!ctx.clientChatInitPromise) {
    await initLLM(console.log);
  }

  const clientChatObj = await ctx.clientChatInitPromise;
  if (
    category === CATEGORY_INDICATOR_HELPER ||
    category === CATEGORY_INDICATOR_HELPER_INLINE
  ) {
    return clientChatObj.generate(await createIndicatorPromptWithRetrieval(query));
  } else {
    return clientChatObj.generate(createPrompt(category, query));
  }
};

export const initLLM = async (progressCallback) => {
  if (!ctx.clientChatInitPromise) {
    ctx.clientChatInitPromise = createChat({
      model: "Mistral-7B-Instruct-v0.1-q4f32_1",
      progressCallback,
    });
  }
};
