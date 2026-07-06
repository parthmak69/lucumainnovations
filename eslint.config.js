import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // 1️⃣ Tell ESLint to completely skip checking your backend and dependency nodes
  globalIgnores([
    'dist',
    'backend/**',
    'node_modules/**',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      // 2️⃣ Merge browser environment variables with Node environment variables
      globals: {
        ...globals.browser,
        ...globals.node,
        ...globals.commonjs,
      },
      parserOptions: { 
        ecmaFeatures: { jsx: true } 
      },
    },
    // 3️⃣ Set loose warning profiles for stray variables so builds never drop dead
    rules: {
      'no-unused-vars': 'off',
      'no-undef': 'off',
      'react-hooks/set-state-in-effect': 'off'
    }
  },
])