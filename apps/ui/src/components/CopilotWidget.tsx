import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverHeader,
  PopoverBody,
  PopoverArrow,
  Button,
  Textarea,
  Kbd,
  Spinner,
  Checkbox,
  Grid,
  Select,
} from "@chakra-ui/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCopilot } from ".";
import { eventBus, debounce } from "../libs";
import {
  EVENT_COPILOT_DEBUG,
  EVENT_COPILOT_QUERY,
  EVENT_COPILOT_UPDATE,
  EVENT_COPILOT_MODE_CHANGE,
  MODE_WEBLLM,
  MODE_MOCK,
  MODE_SERVER,
  MODE_OPENAI,
} from "../const";

export const CopilotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const initialFocusRef = useRef();
  const { category } = useCopilot();
  const [query, setQuery] = useState("");
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);

  useHotkeys(
    "mod+p,ctrl+p",
    () => {
      setIsOpen(!isOpen);
    },
    { enableOnFormTags: ["INPUT", "TEXTAREA", "SELECT"] }
  );

  useEffect(() => {
    const loadingSub = eventBus.subscribe(EVENT_COPILOT_QUERY, () => {
      setLoading(true);
    });

    const updateSub = eventBus.subscribe(EVENT_COPILOT_UPDATE, () => {
      setLoading(false);
      setQuery("");
      setValue("");
      setIsOpen(false);
    });

    setTimeout(() => {
      eventBus.publish(
        EVENT_COPILOT_DEBUG,
        "NOTE: webLLM requires 4GB in browser cache storage, it could be purged from devTools."
      );
    }, 1000);

    return () => {
      eventBus.unsubscribe(EVENT_COPILOT_QUERY, loadingSub);
      eventBus.unsubscribe(EVENT_COPILOT_UPDATE, updateSub);
    };
  }, []);

  const setQueryDebounced = useCallback(
    debounce((value) => setQuery(value), 2000),
    []
  );

  useEffect(() => {
    if (query) {
      eventBus.publish(EVENT_COPILOT_QUERY, { category, query });
    }
  }, [query]);

  return (
    <Grid templateColumns="repeat(2, 0.7fr)" gap={3}>
      <Select
        defaultValue={MODE_MOCK}
        onChange={(e) =>
          eventBus.publish(EVENT_COPILOT_MODE_CHANGE, { mode: e.target.value })
        }
      >
        <option value={MODE_MOCK}>
          Mock
        </option>
        <option value={MODE_WEBLLM}>WebLLM (require 4GB cache)</option>
        <option value={MODE_OPENAI}>OpenAI (require api-key)</option>
        <option value={MODE_SERVER}>PyServer (localhost debug)</option>
      </Select>
      <Popover
        initialFocusRef={initialFocusRef}
        returnFocusOnClose={true}
        isOpen={isOpen}
      >
        <PopoverTrigger>
          <Button
            colorScheme={"yellow"}
            onClick={() => setIsOpen((prev) => !prev)}
          >
            Copilot{" "}
            <Kbd ml={2} mr={1}>
              Ctrl
            </Kbd>{" "}
            + <Kbd mr={1}>P</Kbd>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverArrow />
          <PopoverHeader>Hints</PopoverHeader>
          <PopoverBody>
            {loading ? (
              <Spinner
                thickness="4px"
                speed="0.65s"
                emptyColor="gray.200"
                color="blue.500"
                size="xl"
              />
            ) : (
              <Textarea
                ref={initialFocusRef}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setQueryDebounced(e.target.value);
                }}
                placeholder="Type whatever you need"
              />
            )}
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Grid>
  );
};
