import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import boundaries from 'eslint-plugin-boundaries';
import { defineConfig, globalIgnores } from 'eslint/config';

const boundarySettings = {
    'boundaries/elements': [
        { type: 'shared', pattern: 'shared/*' },
        { type: 'entities', pattern: 'entities/*' },
        { type: 'features', pattern: 'features/*' },
        { type: 'widgets', pattern: 'widgets/*' },
        { type: 'pages', pattern: 'pages/*' },
        { type: 'app', pattern: 'app/*' },
    ],
};

export default defineConfig([
    globalIgnores(['dist']),
    {
        files: ['**/*.{ts,tsx}'],
        extends: [
            js.configs.recommended,
            tseslint.configs.recommended,
            reactHooks.configs.flat.recommended,
            reactRefresh.configs.vite,
        ],
        languageOptions: {
            ecmaVersion: 2020,
            globals: globals.browser,
        },
        plugins: {
            'react-hooks': reactHooks,
            boundaries: boundaries,
        },
        settings: {
            ...boundarySettings,
        },
        rules: {
            ...reactRefresh.configs.recommended.rules,
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],
            '@typescript-eslint/no-explicit-any': 'error',
            'boundaries/element-types': [
                'error',
                {
                    default: 'disallow',
                    rules: [
                        { from: 'shared', allow: ['shared'] },
                        { from: 'entities', allow: ['shared'] },
                        { from: 'features', allow: ['entities', 'shared'] },
                        {
                            from: 'widgets',
                            allow: ['features', 'entities', 'shared'],
                        },
                        {
                            from: 'pages',
                            allow: [
                                'widgets',
                                'features',
                                'entities',
                                'shared',
                            ],
                        },
                        {
                            from: 'app',
                            allow: [
                                'pages',
                                'widgets',
                                'features',
                                'entities',
                                'shared',
                            ],
                        },
                    ],
                },
            ],
        },
    },
]);
