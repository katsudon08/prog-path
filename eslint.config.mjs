import stylistic from "@stylistic/eslint-plugin";
import { defineConfig, globalIgnores } from "eslint/config";
import prettier from "eslint-config-prettier/flat";
import importPlugin from "eslint-plugin-import";
import tseslint from "typescript-eslint";

// max-len はコードの行長も見るが、そこは Prettier の printWidth に任せる
// off にはできないため、実質無効になる極端な値を入れる
const CODE_MAX_LEN_DISABLED = 1000;

// 配列は後ろの要素が前の要素を上書きする。並び順に意味がある
export default defineConfig([
  // ESLint 単体では TypeScript の構文を読めないため、
  // 型注釈を解析できるパーサと TS 向けルールをまとめて入れる
  // 例: no-explicit-any / no-unused-vars / ban-ts-comment
  ...tseslint.configs.recommended,
  {
    // plugins はルールの持ち込み。この時点ではまだ何も動かない
    // eslint-plugin-import は import / export 文を検査する
    plugins: {
      import: importPlugin,
    },
    // rules が実際の点灯。off / warn / error で強さを指定する
    rules: {
      // 親ディレクトリへの相対パスインポートを禁止し、エイリアス使用を強制
      "import/no-relative-parent-imports": "warn",
    },
  },
  // ルールを足す設定ではなく、Prettier と衝突する整形系ルールを
  // すべて off にするだけの設定。整形は Prettier に任せる
  // 配列ではなくオブジェクト1個なので展開せずそのまま置く
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
    // 検査対象の範囲は docs/ci.md を参照。移行完了時にこの2行を消す
    // .prettierignore 側は CSS を対象に残すため拡張子で切っているが、
    // ESLint は config が files で宣言した拡張子しか見ず CSS を
    // 解釈できないため、ここは src/** のままでよい
    "src/**",
    "main.js",
    // 生成物。dist は electron-builder の出力先
    "out/**",
    "build/**",
    "dist/**",
  ]),
]);
