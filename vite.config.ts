import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

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
  test: {
    // 対象は DOM を触らないロジックだけ。jsdom は UI の実装に入る直前に別途入れる
    environment: "node",
    // 置き場所はホワイトリストで宣言する。除外方式だとレイヤが増えたときに素通りする
    include: ["src/{entities,features,shared}/**/*.test.ts"],
  },
});
