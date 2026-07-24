/**
 * @file Vite configuration file for the Contact Management System Frontend.
 * Configures Vite plugins including React support and Babel compiler presets.
 */

import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

/**
 * Builds and returns the Vite configuration object.
 *
 * @returns {import('vite').UserConfig} The Vite configuration object.
 */
function createViteConfig() {
  return defineConfig({
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] })
    ],
  })
}

export default createViteConfig()


