import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages: https://francescoscocco.github.io/Gelato/
const base = process.env.VITE_BASE || "/Gelato/";

export default defineConfig({
  plugins: [react()],
  base,
});
