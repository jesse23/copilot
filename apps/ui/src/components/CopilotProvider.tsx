import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createPrompt, eventBus, wait } from "../libs";
import { createChat } from "../libs/llm";

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

  const copilotSub = useRef(null);

  useEffect(() => {
    const initChatProvider = async () => {
      let clientChatObj = null;
      if (!ctx.clientChatInitPromise) {
        if (LLM_MODE === MODE.CLIENT) {
          ctx.clientChatInitPromise = createChat({
            progressCallback: (msg) => eventBus.publish("copilot.debug", msg),
          });
        } else {
          ctx.clientChatInitPromise = Promise.resolve();
        }

        clientChatObj = await ctx.clientChatInitPromise;

        copilotSub.current = eventBus.subscribe(
          "copilot.query",
          ({ category, query }) => {
            if (LLM_MODE === MODE.CLIENT) {
              clientChatObj.generate(createPrompt(category, query)).then((resp) => {
                eventBus.publish("copilot.update", {
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
                  eventBus.publish("copilot.update", {
                    category,
                    response: data.data,
                  });
                })
                .catch((error) => {
                  console.error("Error:", error); // Handle any errors
                });
            } else {
              wait(1000).then(() => {
                eventBus.publish("copilot.update", {
                  category,
                  response: `{ "commands": { "t": { "id": "echo \`${query}\` as mock"} } }`,
                });
              });
            }
          }
        );
      }
    };

    initChatProvider();

    return () => {
      if (copilotSub.current) {
        eventBus.unsubscribe("copilot.query", copilotSub.current);
        copilotSub.current = null;
      }
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
