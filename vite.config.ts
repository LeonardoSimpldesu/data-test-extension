import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

export default defineConfig({
  plugins: [preact()],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        panel: "src/panel/index.html",
        devtools: "src/devtools/devtools.html",
        popup: "src/popup/index.html",
        background: "src/background/service-worker.ts",
        content: "src/content/content-script.ts"
      },
      output: {
        entryFileNames: "assets/[name].js"
      }
    }
  }
});
