import { Allotment } from "allotment";
import { useCallback, useEffect, useState } from "react";
import { FormControl, FormLabel, Input, Button } from "@chakra-ui/react";
import { eventBus } from "../libs";
import { CATEGORY_COMMAND_CONFIG } from "../const";
import { useCopilot } from "../components";
import styles from "./views.module.css";
import "allotment/dist/style.css";

export function SampleForm() {
  const { setCategory } = useCopilot();
  const [command, setCommand] = useState({
    id: "",
    iconId: "",
    title: "",
    action: "",
    activeWhen: "",
    visibleWhen: "",
    uiAnchor: "",
    priority: "",
  });

  const [result, setResult] = useState({});

  const onChange = useCallback((key, value) => {
    setCommand((prev) => ({ ...prev, [key]: value }));
  }, []);

  // TODO: this should go with focus/active later
  useEffect(() => {
    setCategory(CATEGORY_COMMAND_CONFIG);
    const subs = eventBus.subscribe("copilot.update", ({ response }) => {
      const vm = JSON.parse(response);
      const res = {
        ...((Object.values(vm.commands) || [{}])[0] as Record<string, string>),
        ...((Object.values(vm.commandHandlers || {}) || [{}])[0] as Record<
          string,
          string
        >),
        ...((Object.values(vm.commandPlacements || {}) || [{}])[0] as Record<
          string,
          string
        >),
      } as any;
      if (res.visibleWhen?.condition) {
        res.visibleWhen = res.visibleWhen.condition;
      }
      setCommand(res);
    });
    return () => {
      eventBus.unsubscribe("copilot.update", subs);
      setCategory("");
    };
  }, []);

  return (
    <div className={styles.container}>
      <Allotment defaultSizes={[100, 100]}>
        {/* Left Pane - Rule + Config */}
        <Allotment.Pane>
          <div style={{ padding: "10px" }}>
            <FormControl>
              <FormLabel paddingTop={4}>Command ID</FormLabel>
              <Input
                type="id"
                value={command.id}
                onChange={(e) => onChange("id", e.target.value)}
              />
              <FormLabel paddingTop={4}>Icon ID</FormLabel>
              <Input
                type="iconId"
                value={command.iconId}
                onChange={(e) => onChange("iconId", e.target.value)}
              />
              <FormLabel paddingTop={4}>Command Title</FormLabel>
              <Input
                type="title"
                value={command.title}
                onChange={(e) => onChange("title", e.target.value)}
              />
              <FormLabel paddingTop={4}>Command Action</FormLabel>
              <Input
                type="action"
                value={command.action}
                onChange={(e) => onChange("action", e.target.value)}
              />
              <FormLabel paddingTop={4}>Active When</FormLabel>
              <Input
                type="activeWhen"
                value={command.activeWhen}
                onChange={(e) => onChange("activeWhen", e.target.value)}
              />
              <FormLabel paddingTop={4}>Visible When</FormLabel>
              <Input
                type="visibleWhen"
                value={command.visibleWhen}
                onChange={(e) => onChange("visibleWhen", e.target.value)}
              />
              <FormLabel paddingTop={4}>Command Bar</FormLabel>
              <Input
                type="uiAnchor"
                value={command.uiAnchor}
                onChange={(e) => onChange("uiAnchor", e.target.value)}
              />
              <FormLabel paddingTop={4}>Priority</FormLabel>
              <Input
                type="priority"
                value={command.priority}
                onChange={(e) => onChange("priority", e.target.value)}
              />
              <div style={{ paddingTop: "20px" }}>
                <Button onClick={() => setResult(command)}>
                  Create Command
                </Button>
              </div>
            </FormControl>
          </div>
        </Allotment.Pane>
        {/* Right Pane - Source + Target */}
        <Allotment.Pane>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
