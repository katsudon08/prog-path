import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import stylistic from "@stylistic/eslint-plugin";

// max-len はコードの行長も見るが、そこは Prettier の printWidth に任せる
// off にはできないため、実質無効になる極端な値を入れる
const CODE_MAX_LEN_DISABLED = 1000;

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 相対パスでの親ディレクトリ参照を禁止し、エイリアス使用を強制
      // import プラグインは eslint-config-next が登録済みのため、ここでは登録しない
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
      "@stylistic/max-len": [
        "warn",
        { code: CODE_MAX_LEN_DISABLED, comments: 60, ignoreUrls: true },
      ],
    },
  },
  globalIgnores([
    // 検査対象の範囲は docs/ci.md を参照。移行完了時にこの4行を消す
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
