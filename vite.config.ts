import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // エイリアスは tsconfig.json の paths を単一の正として読む
  plugins: [react(), tsconfigPaths()],
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
