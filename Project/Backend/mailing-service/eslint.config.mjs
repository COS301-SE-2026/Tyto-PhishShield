import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
//import pluginReact from "eslint-plugin-react";
import { defineConfig } from "eslint/config";
export default defineConfig([
    {
        ignores: ["dist/", "node_modules/"]
    },
    { files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"], plugins: { js }, extends: ["js/recommended"], languageOptions: { globals: globals.node } },
    tseslint.configs.recommended,
    //pluginReact.configs.flat.recommended,
]);
//# sourceMappingURL=eslint.config.mjs.map