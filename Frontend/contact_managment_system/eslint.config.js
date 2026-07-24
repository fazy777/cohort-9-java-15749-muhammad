/**
 * @file ESLint configuration file for JavaScript and React component linting.
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Creates and returns the flat ESLint configuration array.
 *
 * @returns {import('eslint').Linter.Config[]} The array of ESLint configurations.
 */
function createEslintConfig() {
  return defineConfig([
    globalIgnores(['dist']),
    {
      files: ['**/*.{js,jsx}'],
      extends: [
        js.configs.recommended,
        reactHooks.configs.flat.recommended,
        reactRefresh.configs.vite,
      ],
      languageOptions: {
        globals: globals.browser,
        parserOptions: { ecmaFeatures: { jsx: true } },
      },
    },
  ])
}

export default createEslintConfig()


