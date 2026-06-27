// dependency-cruiser 設定 — #167「FSD 依存境界の lint 強制」。
//
// Oxlint(vp) は graph レベルの FSD 境界を表現できないため、dependency-cruiser で
// 以下を強制する（実行: `mise run lint:fsd` = depcruise src）。
//   1. レイヤー一方向依存（上位→下位のみ。逆流禁止）
//   2. 同一レイヤーの別スライス横断 import 禁止
//   3. Public API（スライス直下 index）経由のみ。内部ファイルへの直接 import 禁止
//
// `@/` エイリアスと「ディレクトリ → index.ts」解決は options.tsConfig 経由の
// enhanced-resolve で行う（tsconfig.json の paths を単一の正として読む）。

// レイヤー順（低 → 高）。高いレイヤーは低いレイヤーを import できるが、逆は不可。
const LAYERS_LOW_TO_HIGH = ["shared", "entities", "features", "widgets", "pages", "app"];
// スライス（= レイヤー直下の機能単位）を持つレイヤー。横断 import の判定対象。
const SLICED = "entities|features|widgets|pages";
// Public API（index 経由）を強制する単位を持つレイヤー（shared の segment も対象）。
const PUBLIC_API = "entities|features|widgets|pages|shared";

// 各レイヤーから「自分より上位の全レイヤー」への import を禁止する規則を生成する。
const layerReversalRules = LAYERS_LOW_TO_HIGH.flatMap((layer, index) => {
  const higher = LAYERS_LOW_TO_HIGH.slice(index + 1);
  if (higher.length === 0) {
    return [];
  }
  return [
    {
      name: `fsd-no-upward-from-${layer}`,
      comment: `${layer} は上位レイヤー(${higher.join("/")})を import できない（FSD: 依存は上位→下位の一方向）`,
      severity: "error",
      from: { path: `^src/${layer}/` },
      to: { path: `^src/(${higher.join("|")})/` },
    },
  ];
});

export default {
  forbidden: [
    ...layerReversalRules,
    {
      name: "fsd-no-cross-slice",
      comment:
        "同一レイヤーの別スライスを import できない（必要なら上位で合成するか shared へ抽出）",
      severity: "error",
      // $1 = レイヤー, $2 = スライス
      from: { path: `^src/(${SLICED})/([^/]+)/` },
      to: { path: "^src/$1/", pathNot: "^src/$1/$2/" },
    },
    {
      name: "fsd-public-api-only",
      comment:
        "他スライスは Public API(直下 index)経由でのみ import 可。内部ファイルへの直接 import は禁止",
      severity: "error",
      // $1 = レイヤー, $2 = スライス
      from: { path: "^src/([^/]+)/([^/]+)/" },
      to: {
        // スライス直下より深い（= segment 配下の内部ファイル）への import
        path: `^src/(${PUBLIC_API})/[^/]+/[^/]+`,
        pathNot: [
          "^src/$1/$2/", // 同一スライス内の import は許可
          `^src/(${PUBLIC_API})/[^/]+/index\\.tsx?$`, // 直下 index（Public API）は許可
        ],
      },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    includeOnly: "^src/",
    // tsconfig.json の paths を読み、@/ エイリアスと directory→index を解決する。
    tsConfig: { fileName: "tsconfig.json" },
    // `import type` 等のコンパイル時のみの依存も検査対象にする。
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
    },
  },
};
