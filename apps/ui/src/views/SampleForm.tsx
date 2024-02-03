import { Allotment } from "allotment";
import { useCallback, useEffect, useState } from "react";
import { FormControl, FormLabel, Input, Button, Textarea } from "@chakra-ui/react";
import { eventBus } from "../libs";
import { CATEGORY_COMMAND_CONFIG, CATEGORY_INDICATOR_HELPER } from "../const";
import { useCopilot } from "../components";
import { EVENT_COPILOT_UPDATE} from "../const";
import styles from "./views.module.css";
import "allotment/dist/style.css";

interface Indicator {
  iconName: string;
  modelTypes: string;
  prop: string;
}

export function SampleForm() {
  const { setCategory } = useCopilot();
  const [indicator, setIndicator] = useState({
    iconName: "",
    modelTypes: "",
    prop: "" 
  } as Indicator);

  const [result, setResult] = useState({} as Indicator);

  const onChange = useCallback((key, value) => {
    setIndicator((prev) => ({ ...prev, [key]: value }));
  }, []);

  // TODO: this should go with focus/active later
  useEffect(() => {
    setCategory(CATEGORY_INDICATOR_HELPER);
    const subs = eventBus.subscribe(EVENT_COPILOT_UPDATE, ({ response }) => {
      if (response.startsWith("```")) {
        const responseInLines = response.split("\n");
        response = responseInLines.slice(1, responseInLines.length - 1).join("\n");
      }
      const jsonObj = JSON.parse(response);
      setIndicator({
        ...jsonObj,
        modelTypes: jsonObj.modelTypes.join(","),
        prop: jsonObj.prop ? JSON.stringify(jsonObj.prop, null, 2) : ""
      });
    });
    return () => {
      eventBus.unsubscribe(EVENT_COPILOT_UPDATE, subs);
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
              <FormLabel paddingTop={4}>Model Types</FormLabel>
              <Input
                type="modelTypes"
                value={indicator.modelTypes}
                onChange={(e) => onChange("modelTypes", e.target.value)}
              />
              <FormLabel paddingTop={4}>Icon Name</FormLabel>
              <Input
                type="iconName"
                value={indicator.iconName}
                onChange={(e) => onChange("iconName", e.target.value)}
              />
              <FormLabel paddingTop={4}>Property Condition</FormLabel>
              <Textarea
                value={indicator.prop}
                onChange={(e) => onChange("prop", e.target.value)}
              />
              <FormLabel paddingTop={4}>Command Action</FormLabel>
              <div style={{ paddingTop: "20px" }}>
                <Button onClick={() => setResult(indicator)}>
                  Create Indicator 
                </Button>
              </div>
            </FormControl>
          </div>
        </Allotment.Pane>
        {/* Right Pane - Source + Target */}
        <Allotment.Pane>
          <pre>{JSON.stringify({
            ...result,
            ...(
              result.prop && {
                prop: JSON.parse(result.prop)
              }
            ),
            ...(
              result.modelTypes && {
                modelTypes: result.modelTypes.split(',')
              }
            )
          }, null, 2)}</pre>
        </Allotment.Pane>
      </Allotment>
    </div>
  );
}
