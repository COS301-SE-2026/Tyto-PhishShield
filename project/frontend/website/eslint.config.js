import js from '@eslint/js'
import globals from 'globals'
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    ignores: ["dist/", "build/", "temp/", "coverage/"],
  },
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      tseslint.configs.stylisticTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'react-x/static-components': 'off',
      'react-hooks/static-components': 'off',
      'react-x/no-nested-component-definitions': 'off',
      'react-refresh/only-export-components': 'off',
      'react-x/no-context-provider': 'off',
      'react-x/no-use-context': 'off',
      'react-x/purity': 'off',
      'react-x/use-state': 'off',
      'react-x/no-array-index-key': 'warn',
      '@typescript-eslint/consistent-type-definitions': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      'react-hooks/set-state-in-effect': 'off',
    },
  },
])
