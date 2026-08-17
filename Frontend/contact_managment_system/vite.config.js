/**
 * @file Vite configuration file for the Contact Management System Frontend.
 * Configures Vite plugins including React support with null safety and error handling.
 */

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Builds and returns the Vite configuration object with validation.
 *
 * @returns {import('vite').UserConfig} The Vite configuration object.
 * @throws {Error} If configuration fails validation
 */
function createViteConfig() {
  try {
    const config = {
      plugins: [react()],
      server: {
        port: 5173,
        host: true,
        strictPort: false,
      },
      build: {
        outDir: 'dist',
        sourcemap: false,
      },
      preview: {
        port: 4173,
      },
    }

    // Null safety validation
    if (config == null || config.plugins == null) {
      throw new Error('Vite config or plugins is null')
    }

    return defineConfig(config)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown vite config error'
    console.error('Failed to create Vite config:', message)
    throw new Error(`Vite configuration failed: ${message}`, { cause: error })
  }
}

export default createViteConfig()


