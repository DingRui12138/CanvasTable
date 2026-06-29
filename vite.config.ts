import { defineConfig } from "vite";
import { resolve } from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import terser from "@rollup/plugin-terser";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, "src/index.ts"),
      name: "CanvasTable",
    },
    minify: false,
    sourcemap: true,
    rollupOptions: {
      output: [
        {
          format: "es",
          entryFileNames: "canvas-table.js",
          exports: "named",
        },
        {
          format: "es",
          entryFileNames: "canvas-table.min.js",
          exports: "named",
          plugins: [terser()],
          sourcemap: false,
        },
        {
          format: "umd",
          name: "CanvasTable",
          entryFileNames: "canvas-table.umd.cjs",
          exports: "named",
          globals: {},
        },
        {
          format: "umd",
          name: "CanvasTable",
          entryFileNames: "canvas-table.umd.min.js",
          exports: "named",
          globals: {},
          plugins: [terser()],
          sourcemap: false,
        },
      ],
    },
  },
  server: {
    port: 3030,
    open: "/examples/basic.html",
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
});
