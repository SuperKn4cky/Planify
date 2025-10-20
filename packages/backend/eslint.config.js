import eslintJs from "@eslint/js";
import globals from "globals";
import ts from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-plugin-prettier";
import prettierConfig from "eslint-config-prettier";

const { configs: jsConfigs } = eslintJs;

export default [
    {
        ignores: ["dist/", "eslint.config.js"],
    },
    jsConfigs.recommended,
    prettierConfig,
    {
        files: ["src/**/*.ts"],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            parser: tsParser,
            globals: {
                ...globals.node,
            },
        },
        plugins: {
            "@typescript-eslint": ts,
            prettier,
        },
        rules: {
            semi: ["error", "always"],
            quotes: ["error", "double"],
            indent: ["error", 4, { SwitchCase: 1 }],
            "no-console": "off",
            "@typescript-eslint/no-unused-vars": [
                "warn",
                { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
            ],
            "prettier/prettier": "error",
        },
    },
];
