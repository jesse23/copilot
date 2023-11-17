import { Allotment } from "allotment";
import { CodeEditor } from "./CodeEditor";
import { useEffect, useState } from "react";
import styles from "./View.module.css";
import "allotment/dist/style.css";
import { eventBus } from "./eventBus";
import { useCopilot } from "./Copilot";

export default function SampleEditor() {
  const { setCategory } = useCopilot();
  const [content, setContent] = useState("// put config rule below, use `/// ` to start copilot\n");

  // TODO: this should go with focus/active later
  useEffect(() => {
    setCategory("fetch rule");
    const subs = eventBus.subscribe("copilot.update", ({ response }) => {
      setContent(prev => prev + response + "\n")
    });
    return () => {
      eventBus.unsubscribe("copilot.update", subs);
      setCategory("");
    };
  },[]);

  useEffect(() => {
    const contentArray = content.split("\n");
    const lastLine = contentArray.pop()?.trim() || "";
    const hintLine = contentArray.pop()?.trim() || "";

    if (!lastLine && hintLine.startsWith("/// ")) {
      const query = hintLine.replace("/// ", "");
      eventBus.publish("copilot.query", { category: "fetch rule", query });
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
