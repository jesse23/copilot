import { wait } from "..";
import {
  CATEGORY_INDICATOR_HELPER,
  CATEGORY_INDICATOR_HELPER_INLINE,
  CATEGORY_JS_COMPLETION,
  CATEGORY_JS_COMPLETION_INLINE,
} from "../../const";

const { COPILOT_CODEX_API_URL, COPILOT_CODEX_API_KEY } = import.meta.env;

export const queryLLM = async (category: string, query: string) => {
  if (!COPILOT_CODEX_API_KEY) {
    return Promise.resolve("COPILOT_CODEX_API_KEY is not defined");
  }

  if (
    category === CATEGORY_JS_COMPLETION ||
    category === CATEGORY_JS_COMPLETION_INLINE
  ) {
    return fetch(`${COPILOT_CODEX_API_URL}/v1/chat/completions`, {
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
  } else if (
    // "favoriteRank" for ItemRevision.items_tag>Item.master_object>Dataset.rank, while rank>0
    // show icon "favoriteRank" for ItemRevision, while its items_tag is Item, and the Item has attribute master_object and the master_object is Dataset, and the Dataset has attribute rank which is greater than 0
    category === CATEGORY_INDICATOR_HELPER ||
    category === CATEGORY_INDICATOR_HELPER_INLINE
  ) {
    // hard code thread id
    // create msg
    const msgResp = await fetch(
      `${COPILOT_CODEX_API_URL}/v1/threads/thread_1ysapSXIGLfubsDhmEMQV50B/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${COPILOT_CODEX_API_KEY}`,
          "OpenAI-Beta": "assistants=v1",
        },
        body: JSON.stringify({
          role: "user",
          content: query,
        }),
      }
    ).then((res) => res.json());

    const msgID = msgResp.id;

    // start a run
    await fetch(
      `${COPILOT_CODEX_API_URL}/v1/threads/thread_1ysapSXIGLfubsDhmEMQV50B/runs`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${COPILOT_CODEX_API_KEY}`,
          "OpenAI-Beta": "assistants=v1",
        },
        body: JSON.stringify({
          assistant_id: "asst_r7Fnueme2mLTeZUP7UyhYj4M",
        }),
      }
    );

    //  a method check data.value for every 1 seconds until it has value
    const checkValue = async () => {
      return fetch(
        `${COPILOT_CODEX_API_URL}/v1/threads/thread_1ysapSXIGLfubsDhmEMQV50B/messages?before=${msgID}&limit=10`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${COPILOT_CODEX_API_KEY}`,
            "OpenAI-Beta": "assistants=v1",
          },
        }
      )
        .then((res) => res.json())
        .then((data) => {
          const resp = data.data[0];
          // TODO: quick hack
          if (resp?.role === "assistant" && resp?.content[0]?.text?.value) {
            return resp.content[0].text.value;
          } else {
            return wait(1000).then(() => {
              return checkValue();
            });
          }
        });
    };

    return checkValue();
  } else {
    return Promise.resolve("not supported in open AI mode");
  }
};
