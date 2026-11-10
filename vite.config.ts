import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // GitHub Pages path for francescoscocco.github.io/Gelato/
  base: process.env.VITE_BASE || "/",
});
