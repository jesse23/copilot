import { wait } from ".";
import { MODE_OPENAI, MODE_SERVER, MODE_WEBLLM } from "../const";
import { initLLM as initWebLLM, queryLLM as queryWebLLM } from "./web_llm";
import { queryLLM as queryOpenAI } from "./openai";

interface QueryContext {
  mode: string;
  category: string;
  apiKey: string;
}

export const initLLM = async (mode, progressCallback) => {
  if (mode === MODE_WEBLLM) {
    return initWebLLM(progressCallback);
  }
};

export const queryLLM = async (query: string, {mode, category, apiKey}: QueryContext): Promise<string> => {
  if (mode === MODE_WEBLLM) {
    return queryWebLLM(category, query);
  } else if (mode === MODE_OPENAI) {
    return queryOpenAI(category, query, apiKey);
  } else if (mode === MODE_SERVER) {
    return fetch("/llm", {
      method: "POST", // Specify the method
      headers: {
        "Content-Type": "application/json", // Specify the content type
      },
      body: JSON.stringify({
        category,
        query,
      }), // Convert the JavaScript object to a JSON string
    })
      .then((response) => response.json()) // Parse the JSON response
      .then((data) => {
        return data.data;
      })
      .catch((error) => {
        console.error("Error:", error); // Handle any errors
      });
  } else {
    // default mode === MODE_MOCK
    return wait(1000).then(() => {
      return  Promise.resolve(`{ "modelTypes": ["this is a mock response"], "prop": {}, "iconName": "dummy" }`);
    });
  }
};
