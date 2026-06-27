import { defineConfig } from "vite-plus";

// フォーマット/リント対象から外すパス（手書きの日本語ドキュメント・生成物・ロックファイル等）。
// 手書きドキュメントを reformat させないための最小スコープ。
const FORMAT_LINT_IGNORE = ["dist/**", "**/*.md", "public/**", "package.json", "pnpm-lock.yaml"];

// Vite+ の統合設定。標準 Vite 設定に加え test(Vitest) / lint(Oxlint) / fmt(Oxfmt) を集約する。
// lint は type-aware を有効化し、コーディング規約(any 禁止 / 型明示 / 命名 等)をルール化する(#166)。
// Tauri 向けの本格配線(build.target 等)は #171 で行う。
export default defineConfig({
  plugins: [],
  // tsconfig.json の paths を単一の正として解決に使う（Vite 8 ネイティブ・build/test 双方に適用）。
  resolve: {
    tsconfigPaths: true,
  },
  // dev サーバは固定ポート(後続の Tauri 連携を見据える)。
  clearScreen: false,
  server: {
    port: 5173,
    strictPort: true,
  },
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
  },
  lint: {
    ignorePatterns: FORMAT_LINT_IGNORE,
    options: {
      typeAware: true,
      typeCheck: true,
    },
    plugins: ["typescript", "unicorn", "react", "jsx-a11y", "import", "oxc"],
    rules: {
      // === CLAUDE.md 規約直結（error）===
      "typescript/no-explicit-any": "error", // any 禁止（unknown + 型ガードを使う）
      "typescript/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      "unicorn/filename-case": ["error", { case: "kebabCase" }], // ファイル名 kebab-case
      "react/rules-of-hooks": "error",
      // === 補助・スタイル（warn）===
      "no-console": ["warn", { allow: ["warn", "error"] }], // log は warn、error/warn は許可
      "react/exhaustive-deps": "warn",
    },
  },
  fmt: {
    ignorePatterns: FORMAT_LINT_IGNORE,
    semi: true,
    singleQuote: false,
  },
});
