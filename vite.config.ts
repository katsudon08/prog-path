import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  // エイリアスは tsconfig.json の paths を単一の正として読む
  // Tailwind は PostCSS 経由ではなく公式の Vite プラグインで動かす
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  build: {
    // 既定の dist は electron-builder の出力先と衝突するため out にする
    outDir: "out",
  },
});
