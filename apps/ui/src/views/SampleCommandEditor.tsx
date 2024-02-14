import { useEffect, useState } from "react";
import { Allotment } from "allotment";
import { eventBus } from "../libs";
import { useCopilot, CodeEditor } from "../components";
import '../libs/web_llm';
import styles from "./views.module.css";
import "allotment/dist/style.css";
import { CATEGORY_COMMAND_PLACEMENT_HELPER, EVENT_COPILOT_QUERY, EVENT_COPILOT_UPDATE} from "../const";

const CATEGORY = CATEGORY_COMMAND_PLACEMENT_HELPER;

export function SampleCommandEditor() {
  const { setCategory } = useCopilot();
  const [content, setContent] = useState("// use `/// ` to ask your question in one line\n");

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
