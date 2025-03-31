import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import mkcert from "vite-plugin-mkcert";

export default defineConfig({
  plugins: [react(), nodePolyfills(), mkcert()],
  define: {
    global: {},
    "process.env": {},
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis",
      },
    },
  },
});
