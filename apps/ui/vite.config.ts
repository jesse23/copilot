import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tsconfigPaths from 'vite-tsconfig-paths';
import { viteSingleFile } from "vite-plugin-singlefile"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  base: '',
  /*
  build: {
    assetsDir: 'assets',
  },
  */
  server: {
    proxy: {
      // Proxying requests on /api to a backend server running on a different port
      '/llm': {
        target: 'http://localhost:3000', // The backend server URL
        changeOrigin: true, // Needed for virtual hosted sites
        // rewrite: (path) => path.replace(/^\/api/, '') // Rewrite the API request
      }
    }
  }
})
