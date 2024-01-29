import { createContext, useContext, useEffect, useRef, useState } from "react";
import { eventBus, wait, Subscription } from "../libs";
import { queryLLM as queryWebLLM, initWebLLM } from "../libs/web_llm";
import { queryLLM as queryOpenAI } from "../libs/openai";
import {
  EVENT_COPILOT_DEBUG,
  EVENT_COPILOT_QUERY,
  EVENT_COPILOT_UPDATE,
  EVENT_COPILOT_MODE_CHANGE,
  MODE_WEBLLM,
  MODE_SERVER,
  MODE_OPENAI,
} from "../const";

const CopilotContext = createContext(null);

export const CopilotProvider = ({ children }) => {
  const [key, setKey] = useState('');
  const [category, setCategory] = useState("");
  const llmMode = useRef('');

  const copilotSubs = useRef([] as Subscription[]);

  // subscribe to copilot query
  useEffect(() => {
    copilotSubs.current.push({
      topic: EVENT_COPILOT_MODE_CHANGE,
      handler: eventBus.subscribe(EVENT_COPILOT_MODE_CHANGE, ({ mode }) => {
        if (mode === MODE_WEBLLM) {
          initWebLLM((msg) => eventBus.publish(EVENT_COPILOT_DEBUG, msg));
        }
        llmMode.current = mode;
      }),
    });

    copilotSubs.current.push({
      topic: EVENT_COPILOT_QUERY,
      handler: eventBus.subscribe(
        EVENT_COPILOT_QUERY,
        async ({ category, query }) => {
          if (llmMode.current === MODE_WEBLLM) {
            queryWebLLM(category, query).then((resp) => {
              eventBus.publish(EVENT_COPILOT_UPDATE, {
                category,
                response: resp,
              });
            });
          } else if (llmMode.current === MODE_OPENAI) {
            queryOpenAI(category, query).then((resp) => {
              eventBus.publish(EVENT_COPILOT_UPDATE, {
                category,
                response: resp,
              });
            });
          } else if (llmMode.current === MODE_SERVER) {
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
            // default mode === MODE_MOCK
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
