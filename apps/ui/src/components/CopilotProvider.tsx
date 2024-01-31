import { createContext, useContext, useEffect, useRef, useState } from "react";
import { eventBus, wait, Subscription } from "../libs";
import {
  EVENT_COPILOT_DEBUG,
  EVENT_COPILOT_QUERY,
  EVENT_COPILOT_UPDATE,
  EVENT_COPILOT_MODE_CHANGE,
  MODE_MOCK,
} from "../const";
import { initLLM, queryLLM } from "../libs/llm";

const CopilotContext = createContext(null);

export const CopilotProvider = ({ children }) => {
  const [category, setCategory] = useState("");
  const llmMode = useRef(MODE_MOCK);

  const copilotSubs = useRef([] as Subscription[]);

  // subscribe to copilot query
  useEffect(() => {
    copilotSubs.current.push({
      topic: EVENT_COPILOT_MODE_CHANGE,
      handler: eventBus.subscribe(EVENT_COPILOT_MODE_CHANGE, ({ mode }) => {
        initLLM(mode, (msg) => eventBus.publish(EVENT_COPILOT_DEBUG, msg));
        llmMode.current = mode;
      }),
    });

    copilotSubs.current.push({
      topic: EVENT_COPILOT_QUERY,
      handler: eventBus.subscribe(
        EVENT_COPILOT_QUERY,
        async ({ category, query }) => {
          queryLLM(llmMode.current, category, query).then((resp) => {
            eventBus.publish(EVENT_COPILOT_UPDATE, {
              category,
              response: resp,
            });
          });
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
