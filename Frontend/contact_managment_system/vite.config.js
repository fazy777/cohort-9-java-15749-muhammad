/**
 * @file Vite configuration file for the Contact Management System Frontend.
 * Configures Vite plugins including React support and Babel compiler presets.
 */

import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})

