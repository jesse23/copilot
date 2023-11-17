import {
  Grid,
  GridItem,
  Heading,
  Link,
  Spacer,
  Flex,
} from "@chakra-ui/react";
import SampleEditor from "./SampleEditor";
import { useState } from "react";
import SampleForm from "./SampleForm";
import { CopilotControl } from "./Copilot";

const MODE = {
  EDITOR: "rule_editor",
  FORM: "command_form",
  TREE: "compare_tree",
};

export const SandboxPage = () => {
  const [mode, setMode] = useState(MODE.EDITOR);

  return (
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
            <CopilotControl />
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
      </GridItem>
    </Grid>
  );
};
