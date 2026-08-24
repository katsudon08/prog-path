import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import importPlugin from "eslint-plugin-import";
import prettier from "eslint-config-prettier/flat";
import stylistic from "@stylistic/eslint-plugin";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      import: importPlugin,
    },
    rules: {
      // _src 内での相対パスインポートを禁止し、エイリアス使用を強制
      "import/no-relative-parent-imports": "warn",
    },
  },
  // 整形は Prettier に任せ、衝突する ESLint ルールを無効化する
  prettier,
  {
    // prettier は max-len も off にするため、必ずその後で有効化する
    plugins: {
      "@stylistic": stylistic,
    },
    rules: {
      // 長文コメントを検知する。// と /* */ の両方が対象
      // コードの行長は Prettier の printWidth に任せるので code は実質無効化する
      "@stylistic/max-len": ["warn", { code: 1000, comments: 60, ignoreUrls: true }],
    },
  },
  globalIgnores([
    // 移行で破棄予定の現行実装（.katsudon08/今後の方針.md 参照）。移行時にこの4行を消す
    "src/**",
    "app/**",
    "pages/**",
    "main.js",
    // 生成物
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);
