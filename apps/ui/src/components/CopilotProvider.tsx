import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { eventBus, Subscription, initLLM, queryLLM } from "../libs";
import {
  EVENT_COPILOT_DEBUG,
  EVENT_COPILOT_QUERY,
  EVENT_COPILOT_UPDATE,
  MODE_MOCK,
} from "../const";

import {initVectorStore} from "../libs";

const { COPILOT_OPENAI_API_KEY } = import.meta.env;
const CopilotContext = createContext(null);

export const CopilotProvider = ({ children }) => {
  const [apiKey, setApiKey] = useState(COPILOT_OPENAI_API_KEY||"");
  const [category, setCategory] = useState("");
  const [mode, setMode] = useState(MODE_MOCK);

  const updateMode = useCallback(
    (mode) => {
      initLLM(mode, (msg) => eventBus.publish(EVENT_COPILOT_DEBUG, msg));
      setMode(mode);
    },
    [setMode]
  );

  const copilotSubs = useRef([] as Subscription[]);

  // TODO: vector store needs api key for now
  useEffect(() => {
    initVectorStore(apiKey);
  }, [apiKey]);

  // subscribe to copilot query
  useEffect(() => {
    copilotSubs.current.push({
      topic: EVENT_COPILOT_QUERY,
      handler: eventBus.subscribe(
        EVENT_COPILOT_QUERY,
        async ({ category, query }) => {
          queryLLM(query, {
            category,
            mode: mode,
            apiKey,
          }).then((resp) => {
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
  }, [mode, category, apiKey]);

  return (
    <CopilotContext.Provider
      value={{
        mode,
        setMode: updateMode,
        category,
        setCategory,
        apiKey,
        setApiKey,
      }}
    >
      {children}
    </CopilotContext.Provider>
  );
};

export const useCopilot = () => {
  return useContext(CopilotContext);
};
