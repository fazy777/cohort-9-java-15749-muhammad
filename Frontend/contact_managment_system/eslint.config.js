/**
 * @file ESLint configuration file for JavaScript and React component linting.
 */

import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

/**
 * Creates and returns the flat ESLint configuration array with null safety.
 *
 * @returns {import('eslint').Linter.Config[]} The array of ESLint configurations.
 * @throws {Error} If required dependencies are null
 */
function createEslintConfig() {
  try {
    // Null checks for dependencies (HIGH priority fix)
    if (js == null || js.configs == null) {
      throw new Error('ESLint js config is null')
    }
    if (globals == null || globals.browser == null) {
      throw new Error('globals.browser is null')
    }
    if (reactHooks == null || reactHooks.configs == null) {
      throw new Error('reactHooks config is null')
    }
    if (reactRefresh == null || reactRefresh.configs == null) {
      throw new Error('reactRefresh config is null')
    }

    const configArray = defineConfig([
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
        rules: {
          'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
          'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
        },
      },
    ])

    if (configArray == null || !Array.isArray(configArray)) {
      throw new Error('ESLint config array is null or not an array')
    }

    return configArray
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown eslint config error'
    console.error('Failed to create ESLint config:', message)
    throw new Error(`ESLint configuration failed: ${message}`, { cause: error })
  }
}

export default createEslintConfig()


