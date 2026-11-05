import { createRequire } from "node:module";

const req = createRequire(import.meta.resolve("eslint-config-next"));
const nextPlugin = req("@next/eslint-plugin-next");
const reactPlugin = req("eslint-plugin-react");
const hooksPlugin = req("eslint-plugin-react-hooks");
const parser = req("eslint-config-next/parser");

const originalParseForESLint = parser.parseForESLint;
const babelParser = {
  ...parser,
  parseForESLint(code, options) {
    const result = originalParseForESLint(code, options);
    if (result.scopeManager && !result.scopeManager.addGlobals) {
      result.scopeManager.addGlobals = function (names) {
        const globalScope = this.scopes[0];
        if (!globalScope) return;
        for (const name of names) {
          if (!globalScope.set.has(name)) {
            const variable = {
              name,
              scope: globalScope,
              identifiers: [],
              references: [],
              defs: [],
            };
            globalScope.variables.push(variable);
            globalScope.set.set(name, variable);
          }
        }
      };
    }
    return result;
  },
};

export default [
  {
    ignores: [
      ".next/**",
      "src/generated/**",
      "node_modules/**",
    ],
  },
  {
    files: ["src/**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    plugins: {
      "@next/next": nextPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        sourceType: "module",
        allowImportExportEverywhere: true,
        babelOptions: {
          presets: ["next/babel"],
          caller: {
            supportsTopLevelAwait: true,
          },
        },
      },
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...hooksPlugin.configs.recommended.rules,
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react/no-unknown-property": "off",
    },
    settings: {
      react: {
        version: "19.2",
      },
    },
  },
];
