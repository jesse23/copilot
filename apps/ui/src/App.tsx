import { ChakraProvider } from "@chakra-ui/react";
import { SandboxPage } from "./SandboxPage";
import { CopilotContextProvider } from "./Copilot";

export default function App() {
  // 2. Wrap ChakraProvider at the root of your app
  return (
    <ChakraProvider>
      <CopilotContextProvider>
        <SandboxPage />
      </CopilotContextProvider>
    </ChakraProvider>
  );
}
