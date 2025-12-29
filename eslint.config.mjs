import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

const boundarySettings = {
  'boundaries/elements': [
    { type: 'shared', pattern: 'src/shared/*' },
    { type: 'entities', pattern: 'src/entities/*' },
    { type: 'features', pattern: 'src/features/*' },
    { type: 'widgets', pattern: 'src/widgets/*' },
    { type: 'app', pattern: 'app/*' },
  ],
  'boundaries/ignore': ['**/@x/**'],
};

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "main.js", // Electron entry point (CommonJS)
  ]),
  {
    plugins: {
      boundaries,
    },
    settings: {
      ...boundarySettings,
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            // shared は shared のみ許可
            { from: 'shared', allow: ['shared'] },
            // entities は shared のみ許可（同レイヤー不可）
            { from: 'entities', allow: ['shared'] },
            // features は entities, shared のみ許可（同レイヤー不可）
            { from: 'features', allow: ['entities', 'shared'] },
            // widgets は features, entities, shared のみ許可（同レイヤー不可）
            { from: 'widgets', allow: ['features', 'entities', 'shared'] },
            // app は全レイヤーにアクセス可能
            { from: 'app', allow: ['widgets', 'features', 'entities', 'shared'] },
          ],
        },
      ],
    },
  },
]);
