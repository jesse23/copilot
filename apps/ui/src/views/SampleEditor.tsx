import { useEffect, useState } from "react";
import { Allotment } from "allotment";
import { eventBus } from "../libs";
import { useCopilot, CodeEditor } from "../components";
import styles from "./views.module.css";
import "allotment/dist/style.css";
import { CATEGORY_CREATE_JSON, EVENT_COPILOT_UPDATE, EVENT_COPILOT_QUERY } from "../const";

const CATEGORY = CATEGORY_CREATE_JSON;

export function SampleEditor() {
  const { setCategory } = useCopilot();
  const [content, setContent] = useState("// example for create JSON, use `/// ` to start copilot\n");

  // TODO: this should go with focus/active later
  useEffect(() => {
    setCategory(CATEGORY);
    const subs = eventBus.subscribe(EVENT_COPILOT_UPDATE, ({ response }) => {
      setContent(prev => prev + response + "\n")
    });
    return () => {
      eventBus.unsubscribe(EVENT_COPILOT_UPDATE, subs);
      setCategory("");
    };
  },[]);

  useEffect(() => {
    const contentArray = content.split("\n");
    const lastLine = contentArray.pop()?.trim() || "";
    const hintLine = contentArray.pop()?.trim() || "";

    if (!lastLine && hintLine.startsWith("/// ")) {
      const query = hintLine.replace("/// ", "");
      eventBus.publish(EVENT_COPILOT_QUERY, { category: CATEGORY, query });
    }
  }, [content]);

  return (
    <div className={styles.container}>
      <Allotment>
        <CodeEditor code={content} type="js" onChange={setContent} />
      </Allotment>
    </div>
  );
}
