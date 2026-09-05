import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  // Tailwind は PostCSS 経由ではなく公式の Vite プラグインで動かす
  plugins: [react(), tailwindcss()],
  resolve: {
    // エイリアスは tsconfig.json の paths を単一の正として読む
    tsconfigPaths: true,
  },
  build: {
    // 既定の dist は electron-builder の出力先と衝突するため out にする
    outDir: "out",
  },
});
