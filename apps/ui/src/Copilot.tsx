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
import { eventBus } from "./eventBus";
import { wait } from "./utils";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
} from "react";
import { debounce } from "./utils";
import { useHotkeys } from "react-hotkeys-hook";

const IS_MOCK = true;

const CopilotContext = createContext(null);

export const CopilotContextProvider = ({ children }) => {
  const [category, setCategory] = useState("");
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

export const CopilotControl = () => {
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

    const copilotSub = eventBus.subscribe("copilot.query", ({ category, query }) => {
        if (IS_MOCK) {
          wait(1000).then(() => {
            eventBus.publish("copilot.update", {
              category,
              response: `{ "commands": { "t": { "id": "echo \`${query}\`"} } }`,
            });
          });
        } else {
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
              eventBus.publish("copilot.update", { category, response: data.data });
            })
            .catch((error) => {
              console.error("Error:", error); // Handle any errors
            });
        }
      });
    return () => {
      eventBus.unsubscribe("copilot.query", copilotSub);
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
