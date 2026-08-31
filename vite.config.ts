import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const rootDir = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    // 旧コードが使う @/src/... を解決する。エイリアスの再定義は #267
    alias: { "@": rootDir },
  },
  build: {
    // 既定の dist は electron-builder の出力先と衝突するため out にする
    outDir: "out",
    rollupOptions: {
      onwarn(warning, warn) {
        // 旧コードに残る "use client" は Vite では意味を持たない
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        warn(warning);
      },
    },
  },
});
