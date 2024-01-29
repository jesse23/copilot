import { useEffect, useState } from "react";
import { ChakraProvider } from "@chakra-ui/react";
import { Grid, GridItem, Heading, Link, Spacer, Flex } from "@chakra-ui/react";
import { CopilotProvider, CopilotWidget } from "./components";
import { SampleEditor, SampleForm, SampleChat } from "./views";
import { eventBus } from "./libs";
import { EVENT_COPILOT_DEBUG } from "./const";

const MODE = {
  EDITOR: "json_editor",
  FORM: "form_example",
  CHAT: "chat",
  // TREE: "compare_tree",
};

export default function App() {
  const [mode, setMode] = useState(MODE.EDITOR);
  const [info, setInfo] = useState("");

  useEffect(() => {
    const debugSub = eventBus.subscribe(EVENT_COPILOT_DEBUG, (msg) => {
      if(msg.length < 60) {
        msg = msg.trim();
      }else if(msg.length < 200) {
        msg = (msg.trim().split(/\n|(\. )/)||[])[0];
      } else {
        // get very last line
        msg = (msg.trim().split(/\n|(\. )/)||[]).pop();
      }
      setInfo(msg);
    });

    return () => {
      eventBus.unsubscribe(EVENT_COPILOT_DEBUG, debugSub);
    };
  }, []);

  return (
    <ChakraProvider>
      <CopilotProvider>
        <Grid
          templateAreas={`"header"
                  "main"
                  "footer"`}
          gridTemplateRows={"50px 1fr 30px"}
          gridTemplateColumns={"1fr"}
          h="100%"
          gap="0"
          color="blackAlpha.700"
          fontWeight="bold"
        >
          <GridItem pl="2" /*bg='orange.300'*/ area={"header"}>
            <Flex>
              <Heading as="h1" size="lg" paddingTop={1}>
                {mode}
              </Heading>
              <Spacer />
              <div style={{ paddingRight: "20px", paddingTop: "5px" }}>
                <CopilotWidget />
              </div>
            </Flex>
          </GridItem>
          <GridItem
            pl="2"
            /*bg='green.300'*/ area={"main"}
            display="flex"
            borderTop="1px"
            borderColor={"#E2E8F0"}
          >
            {mode === MODE.EDITOR && <SampleEditor />}
            {mode === MODE.FORM && <SampleForm />}
            {mode === MODE.TREE && <div>tree</div>}
            {mode === MODE.CHAT && <SampleChat />}
          </GridItem>
          <GridItem
            pl="2"
            /*bg="blue.300"*/ area={"footer"}
            borderTop="1px"
            borderColor={"#E2E8F0"}
          >
            <Link
              onClick={() => setMode(MODE.EDITOR)}
              paddingRight={5}
              fontFamily={"mono"}
            >
              {MODE.EDITOR}
              {mode === MODE.EDITOR ? "*" : " "}
            </Link>
            <Link
              onClick={() => setMode(MODE.FORM)}
              paddingRight={5}
              fontFamily={"mono"}
            >
              {MODE.FORM}
              {mode === MODE.FORM ? "*" : " "}
            </Link>
            <Link
              onClick={() => setMode(MODE.TREE)}
              paddingRight={5}
              fontFamily={"mono"}
            >
              {MODE.TREE}
              {mode === MODE.TREE ? "*" : " "}
            </Link>
            <Link
              onClick={() => setMode(MODE.CHAT)}
              paddingRight={70}
              fontFamily={"mono"}
            >
              {MODE.CHAT}
              {mode === MODE.CHAT ? "*" : " "}
            </Link>
            <div
              style={{
                color: "gray",
                fontSize: "12px",
                fontStyle: "italic",
                display: "inline",
                position: "absolute",
                textOverflow: "ellipsis",
                textWrap: "nowrap",
                paddingTop: "5px",
                maxWidth: "500px",
                width: "500px",
              }}
            >
              {info}
            </div>
          </GridItem>
        </Grid>
      </CopilotProvider>
    </ChakraProvider>
  );
}
