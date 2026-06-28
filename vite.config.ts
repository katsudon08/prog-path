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
    // plugins は「上書き」= 許可リスト。新たに promise/* 等のルールを使うときは、
    // ここに該当プラグインを追加すること（未追加だと rules に書いても黙って無効化される）。
    plugins: ["typescript", "unicorn", "react", "jsx-a11y", "import", "oxc"],
    rules: {
      // CLAUDE.md のコーディング規約を強制（すべて error で CI ゲートにする）。
      "typescript/no-explicit-any": "error", // any 禁止（unknown + 型ガードを使う）
      "typescript/explicit-function-return-type": [
        "error",
        {
          allowExpressions: true,
          allowTypedFunctionExpressions: true,
          allowHigherOrderFunctions: true,
        },
      ],
      // ファイル名は kebab-case（例 maze-preview.tsx）。識別子(コンポーネント/型)の
      // PascalCase とは別で、ファイル名は kebab が本プロジェクト規約（→ docs/directory-structure.md）。
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "react/rules-of-hooks": "error",
      "react/exhaustive-deps": "error", // hook 依存配列の誤り(stale-closure バグ)を CI で止める
      "no-console": ["error", { allow: ["warn", "error"] }], // console.log 等は禁止。warn/error は許可
    },
    // テスト・型宣言ファイルは厳格ルールを緩める（実用上の慣習。テストの as any や
    // 戻り値型省略、.d.ts の any を許容する）。
    overrides: [
      {
        files: ["**/*.test.{ts,tsx}", "**/*.d.ts"],
        rules: {
          "typescript/no-explicit-any": "off",
          "typescript/explicit-function-return-type": "off",
        },
      },
    ],
  },
  fmt: {
    ignorePatterns: FORMAT_LINT_IGNORE,
    semi: true,
    singleQuote: false,
  },
});
