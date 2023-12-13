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
} from "@chakra-ui/react";
import {
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useCopilot } from ".";
import { eventBus, debounce } from "../libs";

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
    const loadingSub = eventBus.subscribe("copilot.query", () => {
      setLoading(true);
    });

    const updateSub = eventBus.subscribe("copilot.update", () => {
      setLoading(false);
      setQuery("");
      setValue("");
      setIsOpen(false);
    });

    return () => {
      eventBus.unsubscribe("copilot.query", loadingSub);
      eventBus.unsubscribe("copilot.update", updateSub);
    };
  }, []);

  const setQueryDebounced = useCallback(
    debounce((value) => setQuery(value), 2000),
    []
  );

  useEffect(() => {
    if (query) {
      eventBus.publish("copilot.query", { category, query });
    }
  }, [query]);

  return (
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
  );
};
