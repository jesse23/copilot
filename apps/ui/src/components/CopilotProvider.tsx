import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPrompt, eventBus, wait, Subscription } from "../libs";
import { createChat } from "../libs/llm";
import {
  EVENT_COPILOT_DEBUG,
  EVENT_COPILOT_QUERY,
  EVENT_COPILOT_UPDATE,
  EVENT_COPILOT_ENABLE,
} from "../const";

const MODE = {
  CLIENT: "client",
  SERVER: "server",
  MOCK: "mock",
};

const LLM_MODE = MODE.CLIENT;

const CopilotContext = createContext(null);

// NOTE: hack for react debug - react debug will load the hook twice in purpose
const ctx = {
  clientChatInitPromise: null,
};

export const CopilotProvider = ({ children }) => {
  const [category, setCategory] = useState("");
  const [llmEnabled, setLlmEnabled] = useState(false);

  const copilotSubs = useRef([] as Subscription[]);

  useEffect(() => {
    if (llmEnabled && !ctx.clientChatInitPromise) {
      ctx.clientChatInitPromise = createChat({
        progressCallback: (msg) => eventBus.publish(EVENT_COPILOT_DEBUG, msg),
      });
    }
  }, [llmEnabled]);

  // subscribe to copilot query
  useEffect(() => {
    copilotSubs.current.push({
      topic: EVENT_COPILOT_ENABLE,
      handler: eventBus.subscribe(EVENT_COPILOT_ENABLE, ({ enabled }) => {
        setLlmEnabled(enabled);
      }),
    });

    copilotSubs.current.push({
      topic: EVENT_COPILOT_QUERY,
      handler: eventBus.subscribe(
        EVENT_COPILOT_QUERY,
        async ({ category, query }) => {
          if (LLM_MODE === MODE.CLIENT && ctx.clientChatInitPromise) {
            const clientChatObj = await ctx.clientChatInitPromise;
            clientChatObj
              .generate(createPrompt(category, query))
              .then((resp) => {
                eventBus.publish(EVENT_COPILOT_UPDATE, {
                  category,
                  response: resp,
                });
              });
          } else if (LLM_MODE === MODE.SERVER) {
            fetch("/llm", {
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
                eventBus.publish(EVENT_COPILOT_UPDATE, {
                  category,
                  response: data.data,
                });
              })
              .catch((error) => {
                console.error("Error:", error); // Handle any errors
              });
          } else {
            wait(1000).then(() => {
              eventBus.publish(EVENT_COPILOT_UPDATE, {
                category,
                response: `{ "commands": { "t": { "id": "echo \`${query}\` as mock"} } }`,
              });
            });
          }
        }
      ),
    });

    return () => {
      copilotSubs.current.forEach((sub) => {
        eventBus.unsubscribe(sub.topic, sub.handler);
      });
    };
  }, []);

  return (
    <CopilotContext.Provider value={{ category, setCategory }}>
      {children}
    </CopilotContext.Provider>
  );
};

export const useCopilot = () => {
  const { category, setCategory } = useContext(CopilotContext);
  return { category, setCategory };
};
