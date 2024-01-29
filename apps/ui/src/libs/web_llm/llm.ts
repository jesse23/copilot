import * as webllm from "@mlc-ai/web-llm";
import appConfig from "./app_config";

export const createChat = async (
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
