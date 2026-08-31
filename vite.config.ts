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
      // Rollup の警告ハンドラ。return で握りつぶし、warn() で出力
      onwarn(warning, warn) {
        // "use client" は Next の RSC 用マーカーで Vite では無意味。
        // バンドルで先頭から外れる旧コード34ファイル分の警告を消す
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;
        warn(warning);
      },
    },
  },
});
