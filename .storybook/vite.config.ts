import { resolve } from "node:path";

import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

/**
 * Storybook 専用の標準 Vite 設定。
 *
 * root の `vite.config.ts` は Vite+（vite-plus / Rolldown）用で Storybook が解釈できないため、
 * `.storybook/main.ts` の `viteConfigPath` からこの最小構成を読み込ませて隔離する。
 * React プラグインは @storybook/react-vite が自動付与するので、ここでは Tailwind v4 と
 * `@` エイリアスだけを足す。
 */
export default defineConfig({
  plugins: [tailwindcss()],
  resolve: {
    alias: { "@": resolve(process.cwd(), "src") },
  },
});
