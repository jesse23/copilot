import { CATEGORY_JS_COMPLETION } from "../../const";

const {
  COPILOT_CODEX_API_URL,
  COPILOT_CODEX_API_KEY,
} = import.meta.env;

export const queryLLM = async (category: string, query: string) => {
  if(!COPILOT_CODEX_API_KEY) {
    return Promise.resolve("COPILOT_CODEX_API_KEY is not defined");
  }

  if (category === CATEGORY_JS_COMPLETION) {
    return fetch(COPILOT_CODEX_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${COPILOT_CODEX_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content:
              "You are a JavaScript developer. you will complete the partial code with complete statement. The response should be code only without explanation.",
          },
          {
            role: "user",
            content: query,
          },
        ],
        max_tokens: 64,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        const suggestion = data.choices[0].message.content;
        return suggestion;
      });
  } else {
    return Promise.resolve("not supported in open AI mode");
  }
};
