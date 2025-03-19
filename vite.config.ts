import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  root: "./src", // Source files are in src
  build: {
    outDir: "../dist", // Output to dist
    emptyOutDir: true,
    rollupOptions: {
      input: "./src/main.tsx", // Entry point
      output: {
        entryFileNames: "main.js", // Devvit expects main.js
      },
    },
  },
  publicDir: "../webroot", // Serve OBJ file from webroot
});
