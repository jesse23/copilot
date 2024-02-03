import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import { viteSingleFile } from "vite-plugin-singlefile";
import monacoEditorPlugin from "vite-plugin-monaco-editor";
import wasm from "vite-plugin-wasm";
import topLevelAwait from "vite-plugin-top-level-await";


// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    wasm(),
    topLevelAwait(),
    tsconfigPaths(),
    react(),
    (monacoEditorPlugin as any).default({
      /*
      languageWorkers: ['typescript', 'css', 'html', 'json', 'editorWorkerService']
      */
    }),
  ],
  base: "",
  /*
  build: {
    assetsDir: 'assets',
  },
  */
  server: {
    proxy: {
      // Proxying requests on /api to a backend server running on a different port
      "/llm": {
        target: "http://localhost:3000", // The backend server URL
        changeOrigin: true, // Needed for virtual hosted sites
        // rewrite: (path) => path.replace(/^\/api/, '') // Rewrite the API request
      },
    },
  },
  envPrefix: "COPILOT_",
  optimizeDeps: {
    exclude: ['session.workers']
  }
});
